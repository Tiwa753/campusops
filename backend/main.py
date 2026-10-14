from __future__ import annotations

import hashlib
import html
import json
import os
import re
import secrets
import sqlite3
import urllib.error
import urllib.request
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated, Literal
from urllib.parse import urlencode

from fastapi import Cookie, FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

ROOT = Path(__file__).resolve().parent
SESSION_COOKIE = "campusops_session"
SESSION_LIFETIME = timedelta(days=30)
EMAIL_CODE_LIFETIME = timedelta(minutes=10)
DELETE_TOKEN_LIFETIME = timedelta(minutes=30)
VALID_SIGNUP_INTENTS = {"student", "organization_manager", "both"}
VALID_UNIVERSITIES = {"oau"}
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

app = FastAPI(title="CampusOps API", version="1.0.0")


class SignupBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullName: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=72)
    universityId: str
    signupIntent: str

    @field_validator("fullName")
    @classmethod
    def strip_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Enter a name between 2 and 80 characters.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if any(ord(char) < 32 or ord(char) == 127 for char in value):
            raise ValueError("Use a password between 8 and 72 characters.")
        return value

    @field_validator("universityId")
    @classmethod
    def validate_university(cls, value: str) -> str:
        if value not in VALID_UNIVERSITIES:
            raise ValueError("Select a supported university.")
        return value

    @field_validator("signupIntent")
    @classmethod
    def validate_signup_intent(cls, value: str) -> str:
        if value not in VALID_SIGNUP_INTENTS:
            raise ValueError("Choose a valid account type.")
        return value


class EmailBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address.")
        return value


class VerifyBody(EmailBody):
    token: str = Field(pattern=r"^\d{6}$")


class ResetBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(pattern=r"^[a-f0-9]{64}$")
    password: str = Field(min_length=8, max_length=72)
    confirmPassword: str = Field(min_length=8, max_length=72)


def now_utc() -> datetime:
    return datetime.now(UTC)


def iso_time(value: datetime) -> str:
    return value.isoformat()


def db_path() -> Path:
    configured = os.environ.get("CAMPUSOPS_DB_PATH")
    path = Path(configured) if configured else ROOT / "data" / "campusops.sqlite3"
    if not path.is_absolute():
        path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(db_path(), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with connect_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                full_name TEXT NOT NULL,
                university_id TEXT NOT NULL,
                signup_intent TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'admin')),
                password_hash TEXT NOT NULL,
                email_confirmed_at TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS organization_memberships (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                university_id TEXT NOT NULL,
                organization_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('member', 'manager')),
                status TEXT NOT NULL
                    CHECK (status IN ('pending', 'active', 'revoked')),
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user_id_idx
                ON sessions(user_id);
            CREATE TABLE IF NOT EXISTS email_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'recovery')),
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS email_tokens_user_purpose_idx
                ON email_tokens(user_id, purpose);
            CREATE TABLE IF NOT EXISTS deletion_requests (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS deletion_requests_user_idx
                ON deletion_requests(user_id);
            """
        )


@app.on_event("startup")
def on_startup() -> None:
    initialize_database()


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, _error: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": "Check the submitted details and try again."},
    )


def require_same_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "").rstrip("/")
    if not origin or not site_url or origin.rstrip("/") != site_url:
        raise HTTPException(status_code=403, detail="Invalid request origin.")


def hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256$310000${salt.hex()}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return secrets.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def resend_config() -> tuple[str, str]:
    api_key = os.environ.get("RESEND_API_KEY")
    sender = os.environ.get("RESEND_FROM_EMAIL")
    if not api_key or not sender:
        raise HTTPException(
            status_code=503,
            detail=(
                "Email is not configured. Set RESEND_API_KEY and "
                "RESEND_FROM_EMAIL in the environment."
            ),
        )
    return api_key, sender


def send_email(recipient: str, subject: str, text: str, markup: str) -> None:
    api_key, sender = resend_config()
    payload = json.dumps(
        {"from": sender, "to": [recipient], "subject": subject, "text": text, "html": markup}
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status < 200 or response.status >= 300:
                raise HTTPException(
                    status_code=502, detail="Unable to send the email. Try again."
                )
    except urllib.error.HTTPError as error:
        error.close()
        raise HTTPException(
            status_code=502, detail="Unable to send the email. Try again."
        ) from None
    except (urllib.error.URLError, TimeoutError) as error:
        raise HTTPException(
            status_code=502, detail="Unable to reach the email service. Try again."
        ) from error


def issue_email_code(
    user_id: str, email: str, purpose: Literal["signup", "recovery"]
) -> None:
    code = f"{secrets.randbelow(1_000_000):06d}"
    created = now_utc()
    with connect_db() as connection:
        connection.execute(
            "DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?",
            (user_id, purpose),
        )
        connection.execute(
            """
            INSERT INTO email_tokens(token_hash, user_id, purpose, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                hash_secret(code),
                user_id,
                purpose,
                iso_time(created + EMAIL_CODE_LIFETIME),
                iso_time(created),
            ),
        )
    purpose_label = "confirm your CampusOps account" if purpose == "signup" else "reset your CampusOps password"
    safe_code = html.escape(code)
    send_email(
        email,
        "Your CampusOps verification code",
        f"Use this code to {purpose_label}: {code}\n\nThe code expires in 10 minutes.",
        (
            '<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;'
            'color:#17172a;line-height:1.6"><p style="color:#5b5bd6;font-weight:700;'
            'letter-spacing:.08em">CAMPUSOPS</p><h1>Your verification code</h1>'
            f"<p>Use this code to {purpose_label}:</p>"
            '<p style="display:inline-block;background:#eeedff;color:#34329a;padding:14px 20px;'
            f'border-radius:8px;font-size:26px;font-weight:700;letter-spacing:6px">{safe_code}</p>'
            "<p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>"
            "<p>CampusOps</p></main>"
        ),
    )


def create_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    created = now_utc()
    with connect_db() as connection:
        connection.execute(
            """
            INSERT INTO sessions(token_hash, user_id, expires_at, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                hash_secret(token),
                user_id,
                iso_time(created + SESSION_LIFETIME),
                iso_time(created),
            ),
        )
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=os.environ.get("NEXT_PUBLIC_SITE_URL", "").startswith("https://"),
        samesite="lax",
        path="/",
        max_age=int(SESSION_LIFETIME.total_seconds()),
    )


def authenticated_user(session_token: str | None) -> sqlite3.Row:
    if not session_token:
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    with connect_db() as connection:
        row = connection.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
                AND users.email_confirmed_at IS NOT NULL
            """,
            (hash_secret(session_token), iso_time(now_utc())),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    return row


def account_response(user: sqlite3.Row) -> dict[str, object]:
    with connect_db() as connection:
        memberships = connection.execute(
            """
            SELECT university_id, organization_id, role, status
            FROM organization_memberships WHERE user_id = ?
            """,
            (user["id"],),
        ).fetchall()
    account: dict[str, object] = {
        "identity": {
            "id": user["id"],
            "name": user["full_name"],
            "email": user["email"],
        },
        "signupIntent": user["signup_intent"],
        "universityMemberships": [
            {
                "universityId": user["university_id"],
                "role": "administrator" if user["role"] == "admin" else "student",
                "status": "active",
            }
        ],
        "organizationMemberships": [
            {
                "universityId": item["university_id"],
                "organizationId": item["organization_id"],
                "role": item["role"],
                "status": item["status"],
            }
            for item in memberships
        ],
    }
    return account


def account_cookie(
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> str | None:
    return session


@app.post("/auth/sign-up")
def sign_up(body: SignupBody, request: Request) -> dict[str, object]:
    require_same_origin(request)
    if body.signupIntent not in VALID_SIGNUP_INTENTS:
        raise HTTPException(status_code=400, detail="Choose a valid account type.")

    user_id = str(uuid.uuid4())
    created_at = iso_time(now_utc())
    try:
        with connect_db() as connection:
            connection.execute(
                """
                INSERT INTO users(
                    id, email, full_name, university_id, signup_intent,
                    password_hash, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    body.email,
                    body.fullName,
                    body.universityId,
                    body.signupIntent,
                    hash_password(body.password),
                    created_at,
                ),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account already exists for that email. Sign in or request a new verification code.",
        ) from None

    try:
        issue_email_code(user_id, body.email, "signup")
    except Exception:
        with connect_db() as connection:
            connection.execute("DELETE FROM users WHERE id = ?", (user_id,))
        raise
    return {"confirmationRequired": True, "redirectTo": "/dashboard"}


@app.post("/auth/verify-email")
def verify_email(body: VerifyBody, request: Request, response: Response) -> dict[str, str]:
    require_same_origin(request)
    with connect_db() as connection:
        user = connection.execute(
            "SELECT id, email_confirmed_at FROM users WHERE email = ?",
            (body.email,),
        ).fetchone()
        if not user or user["email_confirmed_at"]:
            raise HTTPException(
                status_code=400,
                detail="That verification code is invalid or expired. Request a new code and try again.",
            )
        token = connection.execute(
            """
            SELECT token_hash FROM email_tokens
            WHERE user_id = ? AND purpose = 'signup' AND expires_at > ?
            """,
            (user["id"], iso_time(now_utc())),
        ).fetchone()
        if not token or not secrets.compare_digest(
            token["token_hash"], hash_secret(body.token)
        ):
            raise HTTPException(
                status_code=400,
                detail="That verification code is invalid or expired. Request a new code and try again.",
            )
        connection.execute(
            "UPDATE users SET email_confirmed_at = ? WHERE id = ?",
            (iso_time(now_utc()), user["id"]),
        )
        connection.execute(
            "DELETE FROM email_tokens WHERE user_id = ? AND purpose = 'signup'",
            (user["id"],),
        )
    create_session(response, user["id"])
    return {"redirectTo": "/dashboard"}


@app.post("/auth/resend-confirmation")
def resend_confirmation(body: EmailBody, request: Request) -> dict[str, str]:
    require_same_origin(request)
    with connect_db() as connection:
        user = connection.execute(
            "SELECT id, email_confirmed_at FROM users WHERE email = ?",
            (body.email,),
        ).fetchone()
    if user and not user["email_confirmed_at"]:
        issue_email_code(user["id"], body.email, "signup")
    return {
        "message": "If the account needs confirmation, a new code will arrive shortly."
    }


@app.post("/auth/sign-in")
def sign_in(
    body: dict[str, object], request: Request, response: Response
) -> dict[str, str]:
    require_same_origin(request)
    email_value = body.get("email")
    password_value = body.get("password")
    if not isinstance(email_value, str) or not isinstance(password_value, str):
        raise HTTPException(status_code=400, detail="Enter a valid email address and password.")
    email = email_value.strip().lower()
    if not EMAIL_PATTERN.fullmatch(email) or not 8 <= len(password_value) <= 72:
        raise HTTPException(status_code=400, detail="Enter a valid email address and password.")
    with connect_db() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
    if not user or not check_password(password_value, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not user["email_confirmed_at"]:
        raise HTTPException(
            status_code=403,
            detail="Confirm your email address before signing in. You can resend the confirmation email.",
        )
    create_session(response, user["id"])
    next_path = body.get("next")
    redirect_to = (
        next_path
        if isinstance(next_path, str)
        and next_path.startswith("/")
        and not next_path.startswith("//")
        and "\\" not in next_path
        and not next_path.startswith("/api/")
        and not next_path.startswith("/auth/")
        else "/dashboard"
    )
    return {"redirectTo": redirect_to}


@app.post("/auth/sign-out")
def sign_out(
    request: Request,
    response: Response,
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> dict[str, bool]:
    require_same_origin(request)
    if session:
        with connect_db() as connection:
            connection.execute(
                "DELETE FROM sessions WHERE token_hash = ?", (hash_secret(session),)
            )
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=os.environ.get("NEXT_PUBLIC_SITE_URL", "").startswith("https://"),
        samesite="lax",
    )
    return {"ok": True}


@app.get("/auth/account")
def get_account(
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> dict[str, object]:
    user = authenticated_user(session)
    return {"account": account_response(user)}


@app.post("/auth/forgot-password")
def forgot_password(body: EmailBody, request: Request) -> dict[str, str]:
    require_same_origin(request)
    with connect_db() as connection:
        user = connection.execute(
            "SELECT id, email FROM users WHERE email = ? AND email_confirmed_at IS NOT NULL",
            (body.email,),
        ).fetchone()
    if user:
        token = secrets.token_hex(32)
        created = now_utc()
        with connect_db() as connection:
            connection.execute(
                "DELETE FROM email_tokens WHERE user_id = ? AND purpose = 'recovery'",
                (user["id"],),
            )
            connection.execute(
                """
                INSERT INTO email_tokens(token_hash, user_id, purpose, expires_at, created_at)
                VALUES (?, ?, 'recovery', ?, ?)
                """,
                (
                    hash_secret(token),
                    user["id"],
                    iso_time(created + EMAIL_CODE_LIFETIME),
                    iso_time(created),
                ),
            )
        site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "").rstrip("/")
        reset_url = f"{site_url}/reset-password?{urlencode({'token': token})}"
        escaped_url = html.escape(reset_url, quote=True)
        send_email(
            user["email"],
            "Reset your CampusOps password",
            f"Use this link within 10 minutes to choose a new password: {reset_url}",
            (
                '<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;'
                'color:#17172a;line-height:1.6"><p style="color:#5b5bd6;font-weight:700;'
                'letter-spacing:.08em">CAMPUSOPS</p><h1>Reset your password</h1>'
                '<p>Use the secure link below within 10 minutes to choose a new password.</p>'
                f'<p><a href="{escaped_url}">Reset password</a></p>'
                "<p>If you did not request this, ignore this email.</p><p>CampusOps</p></main>"
            ),
        )
    return {
        "message": "If an account exists for that address, password reset instructions will arrive shortly."
    }


@app.post("/auth/reset-password")
def reset_password(body: ResetBody, request: Request, response: Response) -> dict[str, bool]:
    require_same_origin(request)
    if body.password != body.confirmPassword:
        raise HTTPException(status_code=400, detail="The passwords do not match.")
    with connect_db() as connection:
        token = connection.execute(
            """
            SELECT user_id FROM email_tokens
            WHERE token_hash = ? AND purpose = 'recovery' AND expires_at > ?
            """,
            (hash_secret(body.token), iso_time(now_utc())),
        ).fetchone()
        if not token:
            raise HTTPException(
                status_code=401,
                detail="This password reset link is invalid or expired. Request a new reset link.",
            )
        connection.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (hash_password(body.password), token["user_id"]),
        )
        connection.execute(
            "DELETE FROM email_tokens WHERE user_id = ? AND purpose = 'recovery'",
            (token["user_id"],),
        )
        connection.execute(
            "DELETE FROM sessions WHERE user_id = ?", (token["user_id"],)
        )
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=os.environ.get("NEXT_PUBLIC_SITE_URL", "").startswith("https://"),
        samesite="lax",
    )
    return {"ok": True}


@app.post("/auth/delete-account")
def request_account_deletion(
    request: Request,
    response: Response,
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> dict[str, str]:
    require_same_origin(request)
    user = authenticated_user(session)
    created = now_utc()
    with connect_db() as connection:
        previous = connection.execute(
            "SELECT created_at FROM deletion_requests WHERE user_id = ?",
            (user["id"],),
        ).fetchone()
        if previous:
            last_request = datetime.fromisoformat(previous["created_at"])
            if created - last_request < timedelta(minutes=1):
                raise HTTPException(
                    status_code=429,
                    detail="Please wait a minute before requesting another confirmation email.",
                )
    token = secrets.token_hex(32)
    with connect_db() as connection:
        connection.execute(
            "DELETE FROM deletion_requests WHERE user_id = ?", (user["id"],)
        )
        connection.execute(
            """
            INSERT INTO deletion_requests(token_hash, user_id, expires_at, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                hash_secret(token),
                user["id"],
                iso_time(created + DELETE_TOKEN_LIFETIME),
                iso_time(created),
            ),
        )
    site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "").rstrip("/")
    confirmation_url = f"{site_url}/account-deletion?{urlencode({'token': token})}"
    escaped_url = html.escape(confirmation_url, quote=True)
    try:
        send_email(
            user["email"],
            "Confirm account deletion · CampusOps",
            (
                f"A request was made to delete your CampusOps account. Confirm within 30 minutes: "
                f"{confirmation_url}\nIf you did not request this, ignore this email."
            ),
            (
                '<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;'
                'color:#17172a;line-height:1.6"><p style="color:#5b5bd6;font-weight:700;'
                'letter-spacing:.08em">CAMPUSOPS</p><h1>Confirm account deletion</h1>'
                '<p>This permanently removes your account and memberships. Confirm within 30 minutes:</p>'
                f'<p><a href="{escaped_url}">Review deletion request</a></p>'
                '<p>If you did not request this, ignore this email; your account remains active.</p>'
                "<p>CampusOps</p></main>"
            ),
        )
    except Exception:
        with connect_db() as connection:
            connection.execute(
                "DELETE FROM deletion_requests WHERE token_hash = ?", (hash_secret(token),)
            )
        raise
    return {"message": "Check your email for a link to confirm account deletion."}


class DeleteConfirmationBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(pattern=r"^[a-f0-9]{64}$")


@app.post("/auth/delete-account/confirm")
def confirm_account_deletion(
    body: DeleteConfirmationBody, request: Request, response: Response
) -> dict[str, bool]:
    require_same_origin(request)
    with connect_db() as connection:
        deletion = connection.execute(
            """
            SELECT user_id FROM deletion_requests
            WHERE token_hash = ? AND expires_at > ?
            """,
            (hash_secret(body.token), iso_time(now_utc())),
        ).fetchone()
        if not deletion:
            raise HTTPException(
                status_code=410, detail="This deletion link is invalid or expired."
            )
        connection.execute("DELETE FROM users WHERE id = ?", (deletion["user_id"],))
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=os.environ.get("NEXT_PUBLIC_SITE_URL", "").startswith("https://"),
        samesite="lax",
    )
    return {"ok": True}
