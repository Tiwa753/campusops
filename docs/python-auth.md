# Python authentication backend

Authentication is handled by the FastAPI service in `backend/main.py`. It
stores account profiles, verification codes, password-reset tokens, sessions,
and account-deletion requests in a local SQLite database. Workspace records
remain the existing browser-only preview data.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000`.
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Resend requires a valid API
   key and a sender address on a verified domain. Without these, email-backed
   signup, recovery, and deletion requests return a configuration error.
4. Install and run the API from the repository root:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
   .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000 --env-file .env.local
   ```

5. In a second terminal, install and run the web app:

   ```powershell
   npm ci
   npm run dev
   ```

The Next.js `/api/auth/*` endpoints proxy requests and HttpOnly session cookies
to FastAPI. `CAMPUSOPS_API_URL` defaults to `http://127.0.0.1:8000`; set it to
the private API origin when deploying the web app.

## Signup and verification

Signup creates a pending account, sends a six-digit code through Resend, and
stores only a one-way hash of the code. Codes expire after ten minutes.
Successful verification activates the account and creates an HttpOnly,
SameSite=Lax session cookie. Signup choices are preferences only: public
signup always creates a student membership.

Password recovery and account deletion use single-use, expiring links. Account
deletion still requires an explicit confirmation on the website. Email tokens
and sessions are invalidated when a password changes or the account is
deleted.

## Local data and deployment

The default database is `backend/data/campusops.sqlite3`; override it with
`CAMPUSOPS_DB_PATH`. The database is intentionally local-development storage.
Do not deploy SQLite on an ephemeral or multi-instance host: use a persistent
disk and a single API process, or migrate the Python service to a production
database before scaling.

This backend starts with a fresh account database. Existing Supabase users,
passwords, and memberships are not imported. The previous `NEXT_PUBLIC_SUPABASE_*`
values are not used by the Python auth service. Do not add email-provider
credentials or other secrets to source control.
