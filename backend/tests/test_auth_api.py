import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend import main


class AuthApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.previous = {
            key: os.environ.get(key)
            for key in (
                "CAMPUSOPS_DB_PATH",
                "NEXT_PUBLIC_SITE_URL",
                "RESEND_API_KEY",
                "RESEND_FROM_EMAIL",
            )
        }
        os.environ["CAMPUSOPS_DB_PATH"] = str(
            Path(cls.temp_dir.name) / "campusops-test.sqlite3"
        )
        os.environ["NEXT_PUBLIC_SITE_URL"] = "http://localhost:3000"
        os.environ["RESEND_API_KEY"] = "re_test_key"
        os.environ["RESEND_FROM_EMAIL"] = "CampusOps <test@example.test>"
        cls.client = TestClient(main.app)
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)
        for key, value in cls.previous.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        cls.temp_dir.cleanup()

    def setUp(self):
        with main.connect_db() as connection:
            for table in (
                "deletion_requests",
                "email_tokens",
                "sessions",
                "organization_memberships",
                "users",
            ):
                connection.execute(f"DELETE FROM {table}")
        self.email_sender = patch("backend.main.send_email")
        self.mock_send_email = self.email_sender.start()
        self.addCleanup(self.email_sender.stop)

    def signup(self):
        response = self.client.post(
            "/auth/sign-up",
            headers={"Origin": "http://localhost:3000"},
            json={
                "fullName": "Duke VTI",
                "email": "duke@example.test",
                "password": "strong-pass-123",
                "universityId": "oau",
                "signupIntent": "student",
            },
        )
        return response

    def signup_code(self):
        self.assertEqual(self.signup().status_code, 200)
        email_text = self.mock_send_email.call_args.args[2]
        match = re.search(r"\b\d{6}\b", email_text)
        self.assertIsNotNone(match)
        return match.group()

    def test_signup_requires_code_then_creates_authenticated_account(self):
        code = self.signup_code()
        invalid = self.client.post(
            "/auth/verify-email",
            headers={"Origin": "http://localhost:3000"},
            json={"email": "duke@example.test", "token": "000000"},
        )
        self.assertEqual(invalid.status_code, 400)

        verified = self.client.post(
            "/auth/verify-email",
            headers={"Origin": "http://localhost:3000"},
            json={"email": "duke@example.test", "token": code},
        )
        self.assertEqual(verified.status_code, 200)
        account = self.client.get("/auth/account")
        self.assertEqual(account.status_code, 200)
        self.assertEqual(
            account.json()["account"]["identity"]["email"], "duke@example.test"
        )

    def test_unverified_account_cannot_sign_in_and_can_resend_code(self):
        self.signup()
        response = self.client.post(
            "/auth/sign-in",
            headers={"Origin": "http://localhost:3000"},
            json={"email": "duke@example.test", "password": "strong-pass-123"},
        )
        self.assertEqual(response.status_code, 403)

        resent = self.client.post(
            "/auth/resend-confirmation",
            headers={"Origin": "http://localhost:3000"},
            json={"email": "duke@example.test"},
        )
        self.assertEqual(resent.status_code, 200)
        self.assertEqual(self.mock_send_email.call_count, 2)

    def test_sign_out_invalidates_the_session(self):
        code = self.signup_code()
        self.client.post(
            "/auth/verify-email",
            headers={"Origin": "http://localhost:3000"},
            json={"email": "duke@example.test", "token": code},
        )
        self.assertEqual(self.client.get("/auth/account").status_code, 200)
        signed_out = self.client.post(
            "/auth/sign-out", headers={"Origin": "http://localhost:3000"}
        )
        self.assertEqual(signed_out.status_code, 200)
        self.assertEqual(self.client.get("/auth/account").status_code, 401)

    def test_signup_rejects_a_non_same_origin_request(self):
        response = self.client.post(
            "/auth/sign-up",
            headers={"Origin": "https://attacker.example"},
            json={
                "fullName": "Duke VTI",
                "email": "duke@example.test",
                "password": "strong-pass-123",
                "universityId": "oau",
                "signupIntent": "student",
            },
        )
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
