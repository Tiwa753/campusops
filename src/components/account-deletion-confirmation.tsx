"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountDeletionConfirmation({
  token,
}: {
  token: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirmDeletion() {
    if (!token || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/delete-account/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to delete this account.");
        return;
      }
      router.replace("/account-deleted");
    } catch {
      setError("Couldn’t reach CampusOps. Try opening the link again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="onboarding-layout auth-layout">
      <section className="onboarding-form-section">
        <div className="onboarding-form-card auth-form-card">
          <p className="eyebrow">ACCOUNT DELETION</p>
          <h1>Delete your CampusOps account?</h1>
          <p className="onboarding-intro">
            This permanently removes your account, profile, and organization
            memberships. This cannot be undone.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-danger onboarding-submit"
            onClick={confirmDeletion}
            disabled={!token || pending}
          >
            {pending ? "Deleting account…" : "Permanently delete account"}
          </button>
          {!token && (
            <p className="form-error" role="alert">
              This deletion link is invalid or expired.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
