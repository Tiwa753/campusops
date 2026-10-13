"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Icon from "@/components/icon";

type AuthMode = "signup" | "signin" | "forgot" | "reset";

const authCopy: Record<
  AuthMode,
  { eyebrow: string; title: string; description: string; submit: string }
> = {
  signup: {
    eyebrow: "CREATE YOUR ACCOUNT",
    title: "Join your campus.",
    description: "Create an account to explore your campus workspace.",
    submit: "Create account",
  },
  signin: {
    eyebrow: "WELCOME BACK",
    title: "Sign in to CampusOps.",
    description: "Use the email address and password linked to your account.",
    submit: "Sign in",
  },
  forgot: {
    eyebrow: "ACCOUNT RECOVERY",
    title: "Reset your password.",
    description:
      "Enter your account email and we’ll send a secure password reset link.",
    submit: "Send reset link",
  },
  reset: {
    eyebrow: "CHOOSE A NEW PASSWORD",
    title: "Set a new password.",
    description: "Choose a strong password you haven’t used here before.",
    submit: "Save new password",
  },
};

function errorMessage(code: string | null) {
  if (code === "configuration")
    return "Authentication is not configured yet. Add the Supabase URL, publishable key, and site URL to the environment.";
  if (code === "auth-unavailable")
    return "We couldn’t verify your session. Please try again.";
  if (code === "email-unverified")
    return "Confirm your email address before opening your campus workspace.";
  if (code === "auth-callback")
    return "That sign-in link is invalid or expired. Request a new one and try again.";
  return "";
}

export default function AuthPanel({
  mode,
  errorCode,
  verificationNotice = false,
}: {
  mode: AuthMode;
  errorCode?: string;
  verificationNotice?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    if (mode !== "signin") return "";
    if (verificationNotice) {
      return "Confirm your email address before signing in. Use the link we sent you.";
    }
    return errorMessage(errorCode ?? null);
  });
  const [email, setEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());
    if (mode === "signin") {
      body.next = new URLSearchParams(window.location.search).get("next") ?? "";
      setEmail(String(body.email ?? ""));
    }
    const endpoint = {
      signup: "/api/auth/sign-up",
      signin: "/api/auth/sign-in",
      forgot: "/api/auth/forgot-password",
      reset: "/api/auth/reset-password",
    }[mode];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        confirmationRequired?: boolean;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Unable to complete this request.");
        return;
      }
      setEmail(String(body.email ?? email));

      if (mode === "signup" && result.confirmationRequired) {
        setNotice(
          "Your account is ready. Check your email and confirm your address before signing in.",
        );
      } else if (mode === "signup") {
        router.replace(result.redirectTo ?? "/dashboard");
        router.refresh();
      } else if (mode === "signin") {
        router.replace(result.redirectTo ?? "/dashboard");
        router.refresh();
      } else if (mode === "forgot") {
        setNotice(
          result.message ??
            "If an account exists for that address, we’ll send password reset instructions.",
        );
      } else {
        setNotice("Password updated. You can now sign in with the new password.");
        router.replace("/sign-in");
      }
    } catch {
      setError("Couldn’t reach the authentication service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!email || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Unable to resend the confirmation email.");
      } else {
        setNotice(
          result.message ??
            "If the account needs confirmation, a new email will arrive shortly.",
        );
      }
    } catch {
      setError("Couldn’t reach the authentication service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const needsConfirmation =
    mode === "signin" &&
    (/confirm your email/i.test(error) || /confirm your email/i.test(notice));
  const copy = authCopy[mode];
  const isPasswordRecovery = mode === "forgot";
  const primaryPath = mode === "signup" ? "/sign-up" : "/sign-in";

  return (
    <main className="onboarding-layout auth-layout">
      <section className="onboarding-story">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Icon name="building" size={24} />
          </span>
          <span>
            campus<span className="brand-light">ops</span>.
          </span>
        </Link>
        <div className="onboarding-story-body">
          <span className="onboarding-kicker">
            CAMPUS ORGANIZATIONS, EVENTS, AND OPERATIONS
          </span>
          <h1>
            Your campus.
            <br />
            Better connected.
          </h1>
          <p>
            Keep campus communities, opportunities, and the work behind them
            moving together.
          </p>
          <div className="onboarding-campus">
            <span className="university-icon">
              <Icon name="shield" size={21} />
            </span>
            <div>
              <strong>Account security</strong>
              <span>Email verification and secure session cookies</span>
            </div>
          </div>
        </div>
        <small>CampusOps account access</small>
      </section>
      <section className="onboarding-form-section">
        <Link href="/" className="back-to-campus">
          <Icon name="arrow" size={15} />
          Back to CampusOps
        </Link>
        <div className="onboarding-form-card auth-form-card">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p className="onboarding-intro">{copy.description}</p>
          <form onSubmit={submit} aria-label={copy.title}>
            {mode === "signup" && (
              <>
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    name="fullName"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>University</span>
                  <select name="universityId" defaultValue="oau" required>
                    <option value="oau">Obafemi Awolowo University (OAU)</option>
                  </select>
                </label>
                <label className="auth-field">
                  <span>What are you signing up as?</span>
                  <select name="signupIntent" defaultValue="student" required>
                    <option value="student">Student</option>
                    <option value="organization_manager">
                      Organization manager
                    </option>
                    <option value="both">Both</option>
                  </select>
                  <small>
                    Manager tools appear only after an organization provisions
                    an active manager membership. This choice does not grant
                    access.
                  </small>
                </label>
              </>
            )}
            {mode !== "reset" && (
              <label className="auth-field">
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            {(mode === "signin" || mode === "signup") && (
              <label className="auth-field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </label>
            )}
            {mode === "reset" && (
              <>
                <label className="auth-field">
                  <span>New password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
                <label className="auth-field">
                  <span>Confirm new password</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              </>
            )}
            {notice && (
              <div className="auth-notice" role="status">
                <Icon name="help" size={17} />
                <span>{notice}</span>
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button button-primary onboarding-submit"
              disabled={busy}
            >
              {busy ? "Please wait…" : copy.submit}
              {!busy && <Icon name="arrow" size={17} />}
            </button>
            {((mode === "signup" && notice) || needsConfirmation) && (
              <button
                type="button"
                className="text-button auth-resend"
                onClick={resendConfirmation}
                disabled={busy || !email}
              >
                {busy ? "Sending…" : "Resend confirmation email"}
              </button>
            )}
          </form>
          {mode === "signin" && (
            <Link href="/forgot-password" className="auth-secondary-link">
              Forgot password?
            </Link>
          )}
          <p className="auth-switch">
            {mode === "signup" ? (
              <>
                Already have an account? <Link href="/sign-in">Sign in</Link>
              </>
            ) : mode === "signin" ? (
              <>
                New to CampusOps? <Link href="/sign-up">Create an account</Link>
              </>
            ) : (
              <Link href={primaryPath}>
                <Icon name="arrow" size={14} />
                Back to {mode === "reset" ? "sign in" : "account access"}
              </Link>
            )}
          </p>
          {isPasswordRecovery && (
            <p className="auth-privacy-note">
              If an account exists for this address, we’ll send recovery
              instructions.
            </p>
          )}
        </div>
        <p className="onboarding-footnote">
          Your campus role and permissions come from verified account
          memberships, not signup form choices.
        </p>
      </section>
    </main>
  );
}
