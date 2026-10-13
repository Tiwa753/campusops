"use client";

import { useRouter } from "next/navigation";
import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { useState } from "react";
import { Badge, Modal, PageHeader, PanelHeader } from "@/components/ui";
import { initials } from "@/lib/domain";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, account, context, university, accessLabel, data, reset } =
    useCampus();
  const [confirmReset, setConfirmReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [deletionPending, setDeletionPending] = useState(false);
  const [deletionError, setDeletionError] = useState("");
  const [deletionNotice, setDeletionNotice] = useState("");

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setSignOutError(result.error ?? "Unable to end your session.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setSignOutError("Couldn’t reach the authentication service. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  async function requestAccountDeletion() {
    if (deletionPending) return;
    setDeletionPending(true);
    setDeletionError("");
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setDeletionError(result.error ?? "Unable to send the confirmation email.");
        return;
      }
      setConfirmDeletion(false);
      setDeletionNotice(
        result.message ?? "Check your email to confirm account deletion.",
      );
    } catch {
      setDeletionError("Couldn’t reach CampusOps. Please try again.");
    } finally {
      setDeletionPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT & ACCESS"
        title="One account. All your campus roles."
        description="Your university and approved memberships determine the tools available to you."
      />
      <section className="panel settings-panel">
        <PanelHeader
          title="Your account"
          description="Account permissions cannot be changed from the navigation bar."
        />
        <div className="settings-profile">
          <span className="avatar avatar-large avatar-green">
            {initials(profile.name)}
          </span>
          <div>
            <h3>{profile.name}</h3>
            <p>{profile.email}</p>
          </div>
          <span className="role-pill">
            <Icon name="shield" size={16} />
            {accessLabel}
          </span>
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader
          title="University membership"
          description="Access is scoped to your university, including all records and reports."
        />
        <div className="membership-row">
          <span className="org-icon color-green">
            <Icon name="building" size={20} />
          </span>
          <div>
            <strong>{university.name}</strong>
            <p>
              {university.location} ? {university.timeZone}
            </p>
          </div>
          <Badge value="active" />
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader
          title="Signup preference"
          description="This records the experience you selected; it does not grant permissions."
        />
        <div className="settings-description">
          <p>
            {account.signupIntent === "organization_manager"
              ? "Organization manager"
              : account.signupIntent === "both"
                ? "Student and organization manager"
                : "Student"}
            . Student access is available to every verified account.
            Organization management appears only after an organization
            administrator provisions an active manager membership.
          </p>
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader
          title="Organization memberships"
          description="Leading a club adds management access. Your student identity and personal applications stay the same."
        />
        {account.organizationMemberships
          .filter((item) => item.universityId === university.id)
          .map((item) => (
            <div className="membership-row" key={item.organizationId}>
              <span className="org-icon color-purple">
                <Icon name="people" size={20} />
              </span>
              <div>
                <strong>
                  {data.organizations.find(
                    (org) => org.id === item.organizationId,
                  )?.name ?? "Organization"}
                </strong>
                <p>
                  {item.role === "manager" ? "Organization leader" : "Member"} ?
                  Membership-based access
                </p>
              </div>
              <Badge value={item.status} />
            </div>
          ))}
      </section>
      <section className="panel settings-panel">
        <PanelHeader
          title="Session"
          description="End your CampusOps session on this device."
        />
        <div className="settings-description">
          <button
            className="button button-secondary"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? "Logging out…" : "Log out"}
          </button>
          {signOutError && (
            <p className="form-error" role="alert">
              {signOutError}
            </p>
          )}
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader
          title="Delete account"
          description="Request a confirmation email to permanently remove your authenticated account."
        />
        <div className="settings-description">
          <p>
            Your profile and organization memberships will be removed only
            after you confirm from your verified email address. The link
            expires after 30 minutes. Local sample preview records remain in
            this browser because they are separate from your authenticated
            account.
          </p>
          <button
            className="button button-danger"
            onClick={() => {
              setDeletionError("");
              setConfirmDeletion(true);
            }}
          >
            Request account deletion
          </button>
          {deletionNotice && (
            <p className="auth-notice" role="status">
              {deletionNotice}
            </p>
          )}
          {deletionError && (
            <p className="form-error" role="alert">
              {deletionError}
            </p>
          )}
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader title="How access works" />
        <div className="table-scroll">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Access is granted by</th>
                <th>What you can do</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>My campus</td>
                <td>Verified university membership</td>
                <td>Explore events, apply, and follow your own activity</td>
              </tr>
              <tr>
                <td>Manage organization</td>
                <td>Approved leadership membership</td>
                <td>
                  Manage that organization?s events, tasks, and applicants
                </td>
              </tr>
              <tr>
                <td>University administration</td>
                <td>Authorized invitation</td>
                <td>Manage operations across that university</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="settings-description">
          <p>
            Current workspace:{" "}
            <strong>
              {context.kind === "personal"
                ? "My campus"
                : context.kind === "organization"
                  ? "Organization management"
                  : "University administration"}
            </strong>
            . Moving between your spaces never changes your identity or grants
            new permissions.
          </p>
          <p>
            You cannot review your own event application. Another authorized
            reviewer must make the decision.
          </p>
        </div>
      </section>
      <section className="panel settings-panel">
        <PanelHeader title="Local product preview" />
        <div className="settings-description">
          <p>
            You are using a sample account with a student membership and
            approved leadership access. Records stay in this browser. Real
            authentication, membership verification, and a shared database will
            be connected in the next implementation stage.
          </p>
          <div className="reset-row">
            <div>
              <strong>Reset local sample data</strong>
              <p>Restore the sample account and records in this browser.</p>
            </div>
            <button
              className="button button-danger"
              onClick={() => setConfirmReset(true)}
            >
              Reset preview
            </button>
          </div>
        </div>
      </section>
      {confirmReset && (
        <Modal
          title="Reset this local preview?"
          description="This restores sample data in this browser. It does not change any real account or membership."
          onClose={() => setConfirmReset(false)}
        >
          <div className="modal-footer">
            <button
              className="button button-secondary"
              onClick={() => setConfirmReset(false)}
            >
              Keep my changes
            </button>
            <button
              className="button button-danger"
              onClick={async () => {
                await reset();
                setConfirmReset(false);
              }}
            >
              Restore sample data
            </button>
          </div>
        </Modal>
      )}
      {confirmDeletion && (
        <Modal
          title="Request account deletion?"
          description={`We’ll send a confirmation link to ${profile.email}. Your account stays active unless you open that email and confirm deletion.`}
          onClose={() => setConfirmDeletion(false)}
        >
          <div className="modal-footer">
            <button
              className="button button-secondary"
              onClick={() => setConfirmDeletion(false)}
              disabled={deletionPending}
            >
              Keep my account
            </button>
            <button
              className="button button-danger"
              onClick={requestAccountDeletion}
              disabled={deletionPending}
            >
              {deletionPending ? "Sending…" : "Send confirmation email"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
