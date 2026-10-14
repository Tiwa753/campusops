# CampusOps email setup

Supabase's default sender cannot be renamed. Verify a sending domain with
Resend, then configure Supabase Auth to use Resend's SMTP service. Use the same
verified sender identity for `RESEND_FROM_EMAIL`.

## Resend and Supabase SMTP

1. Add and verify a sending domain in Resend. Publish the DNS records Resend
   provides before sending production mail.
2. In Supabase, open **Authentication → Email → SMTP Settings**, enable custom
   SMTP, and use:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (STARTTLS)
   - Username: `resend`
   - Password: your Resend API key
   - Sender name: `CampusOps`
   - Sender email: the verified address used in `RESEND_FROM_EMAIL`
3. Open **Authentication → Email Templates → Confirm signup**. Set the subject
   to `Your CampusOps verification code` and replace the message with the
   template below. The signup form verifies the numeric code in this email, so
   the template must include `{{ .Token }}` rather than only a confirmation
   link.
4. Keep the Supabase Site URL and allowed callback URL in sync with
   `NEXT_PUBLIC_SITE_URL`. For local development, add
   `http://localhost:3000/auth/callback`; use the deployed HTTPS callback URL
   when testing links on a phone.

## Confirm signup template

```html
<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#17172a;line-height:1.6">
  <p style="color:#5b5bd6;font-weight:700;letter-spacing:.08em">CAMPUSOPS</p>
  <h1 style="font-size:24px">Confirm your CampusOps account</h1>
  <p>Thanks for joining CampusOps. Enter this verification code on the signup page to activate your account:</p>
  <p style="display:inline-block;background:#eeedff;color:#34329a;padding:14px 20px;border-radius:8px;font-size:26px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
  <p>This code expires after the period configured in Supabase Auth.</p>
  <p>If you did not create this account, you can ignore this email.</p>
  <p>CampusOps</p>
</div>
```

## Account-deletion confirmation

The app sends a separate CampusOps-branded confirmation using Resend. The
email link opens a page with a final delete button so automated email link
scanners cannot delete accounts just by previewing the link. The token is
single-use, expires after 30 minutes, and is stored hashed in Supabase.

Set these server-only values in `.env.local` and deployment secrets:

- `SUPABASE_SERVICE_ROLE_KEY`: the Supabase `sb_secret_...` key or legacy
  `service_role` key. Never use a publishable/anon key, and never prefix this
  variable with `NEXT_PUBLIC_`.
- `RESEND_API_KEY`: a Resend API key allowed to send from the verified domain.
- `RESEND_FROM_EMAIL`: for example, `CampusOps <no-reply@example.edu>`.

The server key is used only by account-deletion route handlers to store hashed
one-time tokens and delete the verified account after confirmation. It is never
sent to browser code. Deletion removes the Supabase Auth user and cascades to
the profile and memberships. Preview/sample records are still local browser
data and are not removed by account deletion.
