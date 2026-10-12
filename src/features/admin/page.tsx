"use client";

import Link from "next/link";
import { useCampus } from "@/components/campus-provider";
import { ActivityFeed, ParticipationChart } from "@/components/analytics";
import { EventsTable } from "@/components/data-tables";
import Icon from "@/components/icon";
import { Badge, PageHeader, PanelHeader } from "@/components/ui";
import { eventStartTime } from "@/lib/domain";

export default function AdminPage() {
  const { scoped, profile, openDialog, university } = useCampus();
  if (profile.role !== "admin") return null;

  const upcoming = scoped.events
    .filter(
      (event) =>
        event.status === "published" &&
        eventStartTime(event) > new Date().getTime(),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const pendingApplications = scoped.applications.filter(
    (application) => application.status === "pending",
  ).length;
  const activeOrganizations = scoped.organizations.filter(
    (organization) => organization.status === "active",
  ).length;
  const communityMembers = scoped.organizations.reduce(
    (total, organization) => total + organization.members,
    0,
  );
  const applicationStatuses = [
    "pending",
    "approved",
    "rejected",
    "withdrawn",
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={`${university.shortName} · UNIVERSITY ADMINISTRATION`}
        title="Campus operations."
        description={`A campus-wide view of ${university.name}, its organizations, opportunities, and participation.`}
      >
        <Link className="button button-secondary" href="/analytics">
          <Icon name="chart" size={17} />
          Full analytics
        </Link>
        <button
          className="button button-primary"
          onClick={() => openDialog({ type: "organization" })}
        >
          <Icon name="plus" size={17} />
          Add organization
        </button>
      </PageHeader>

      <div className="stats-grid">
        <Link href="/organizations" className="stat-card">
          <div className="stat-top">
            <span>Active organizations</span>
            <span className="stat-icon color-green">
              <Icon name="building" size={18} />
            </span>
          </div>
          <strong className="stat-number">
            {activeOrganizations.toLocaleString()}
          </strong>
          <div className="stat-bottom">
            <span>{scoped.organizations.length} total campus organizations</span>
            <Icon name="arrow" size={15} />
          </div>
        </Link>
        <Link href="/events" className="stat-card">
          <div className="stat-top">
            <span>Upcoming opportunities</span>
            <span className="stat-icon color-blue">
              <Icon name="calendar" size={18} />
            </span>
          </div>
          <strong className="stat-number">{upcoming.length.toLocaleString()}</strong>
          <div className="stat-bottom">
            <span>Published across campus</span>
            <Icon name="arrow" size={15} />
          </div>
        </Link>
        <Link href="/applications" className="stat-card">
          <div className="stat-top">
            <span>Pending applications</span>
            <span className="stat-icon color-purple">
              <Icon name="file" size={18} />
            </span>
          </div>
          <strong className="stat-number">
            {pendingApplications.toLocaleString()}
          </strong>
          <div className="stat-bottom">
            <span>Across all campus opportunities</span>
            <Icon name="arrow" size={15} />
          </div>
        </Link>
        <div className="stat-card">
          <div className="stat-top">
            <span>Organization memberships</span>
            <span className="stat-icon color-orange">
              <Icon name="people" size={18} />
            </span>
          </div>
          <strong className="stat-number">
            {communityMembers.toLocaleString()}
          </strong>
          <div className="stat-bottom">
            <span>Reported by campus organizations</span>
          </div>
        </div>
      </div>

      <div className="dashboard-middle">
        <section className="panel upcoming-panel">
          <PanelHeader
            title="Campus opportunities"
            description="Published events and programs coming up across campus."
          >
            <Link href="/events" className="text-link">
              Manage opportunities
              <Icon name="arrow" size={15} />
            </Link>
          </PanelHeader>
          <EventsTable events={upcoming.slice(0, 5)} compact />
          <div className="panel-table-footer">
            <span>{upcoming.length} upcoming opportunities</span>
            <span>
              <span className="live-dot" />
              University-wide view
            </span>
          </div>
        </section>
        <section className="panel">
          <PanelHeader
            title="Application overview"
            description="Status across all campus opportunities."
          />
          <div className="breakdown-list">
            {applicationStatuses.map((status) => {
              const count = scoped.applications.filter(
                (application) => application.status === status,
              ).length;
              return (
                <div key={status}>
                  <div>
                    <Badge value={status} />
                    <strong>{count}</strong>
                  </div>
                  <div className="breakdown-track">
                    <span
                      className={`breakdown-fill fill-${status}`}
                      style={{
                        width: `${(count / Math.max(1, scoped.applications.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="panel-table-footer">
            <Link href="/applications" className="text-link">
              Review applications
              <Icon name="arrow" size={15} />
            </Link>
          </div>
        </section>
      </div>

      <div className="dashboard-bottom">
        <ParticipationChart />
        <section className="panel">
          <PanelHeader
            title="Recent campus activity"
            description="The latest activity across your university."
          />
          <ActivityFeed limit={5} />
        </section>
      </div>

      <section className="panel">
        <PanelHeader
          title="Organization oversight"
          description="Review membership, leadership, and organization status."
        >
          <Link href="/organizations" className="text-link">
            Manage organizations
            <Icon name="arrow" size={15} />
          </Link>
        </PanelHeader>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Category</th>
                <th>Organization lead</th>
                <th>Members</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {scoped.organizations.map((organization) => (
                <tr key={organization.id}>
                  <td>
                    <div className="table-identity">
                      <span
                        className={`org-icon color-${organization.color}`}
                      >
                        {organization.initials}
                      </span>
                      <strong>{organization.name}</strong>
                    </div>
                  </td>
                  <td>{organization.category}</td>
                  <td>{organization.lead}</td>
                  <td>{organization.members.toLocaleString()}</td>
                  <td>
                    <Badge value={organization.status} />
                  </td>
                  <td>
                    <button
                      className="button button-small button-secondary"
                      onClick={() =>
                        openDialog({
                          type: "organization",
                          id: organization.id,
                        })
                      }
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-table-footer">
          {scoped.organizations.length} organizations in this university
        </div>
      </section>
    </>
  );
}
