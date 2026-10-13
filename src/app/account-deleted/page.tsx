import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account deleted · CampusOps",
  robots: { index: false, follow: false },
};

export default function AccountDeletedPage() {
  return (
    <main className="onboarding-layout auth-layout">
      <section className="onboarding-form-section">
        <div className="onboarding-form-card auth-form-card">
          <p className="eyebrow">ACCOUNT CLOSED</p>
          <h1>Your account has been deleted.</h1>
          <p className="onboarding-intro">
            Your CampusOps authentication account, profile, and organization
            memberships have been permanently removed.
          </p>
          <Link className="button button-primary onboarding-submit" href="/">
            Return to CampusOps
          </Link>
        </div>
      </section>
    </main>
  );
}
