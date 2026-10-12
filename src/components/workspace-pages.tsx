"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampus } from "./campus-provider";
import {
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  PanelHeader,
  SearchInput,
} from "./ui";
import Icon from "./icon";
import { ApplicationsTable, EventsTable, TasksTable } from "./data-tables";
import { ActivityFeed, ParticipationChart } from "./analytics";
import { exportCsv, initials } from "@/lib/domain";

function download(rows: (string | number)[][], filename: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + exportCsv(rows)], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" aria-label="Filter records">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          aria-pressed={value === tab.value}
          className={value === tab.value ? "selected" : ""}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function EventsPage() {
  const { scoped, profile, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [kind, setKind] = useState("all");
  const events = scoped.events
    .filter(
      (event) =>
        (tab === "all" ||
          (tab === "upcoming"
            ? event.status === "published" &&
              new Date(`${event.date}T${event.time}`) > new Date()
            : event.status === tab)) &&
        (kind === "all" || event.kind === kind) &&
        `${event.title} ${event.location} ${scoped.organizations.find((org) => org.id === event.organizationId)?.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      tab === "completed"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
  return (
    <>
      <PageHeader
        eyebrow="GET TOGETHER"
        title={
          profile.role === "student"
            ? "Find your next opportunity."
            : "Good things on the calendar."
        }
        description={
          profile.role === "student"
            ? "Events to experience. Programs to grow with. Find what speaks to you."
            : "Plan events, run programs, and give your community something to look forward to."
        }
      >
        {profile.role !== "student" && (
          <button
            className="button button-primary"
            onClick={() => openDialog({ type: "event" })}
          >
            <Icon name="plus" size={17} />
            Create opportunity
          </button>
        )}
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "upcoming", label: "Upcoming" },
            {
              value: "all",
              label: "All opportunities",
              count: scoped.events.length,
            },
            { value: "completed", label: "Completed" },
            ...(profile.role !== "student"
              ? [{ value: "draft", label: "Drafts" }]
              : []),
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search opportunities…"
          />
          <select
            aria-label="Opportunity type"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All types</option>
            <option value="event">Events</option>
            <option value="program">Programs</option>
          </select>
        </div>
        <EventsTable events={events} />
        <div className="panel-table-footer">
          Showing {events.length}{" "}
          {events.length === 1 ? "opportunity" : "opportunities"}
        </div>
      </section>
    </>
  );
}

export function OrganizationsPage() {
  const { scoped, profile, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const organizations = scoped.organizations.filter(
    (org) =>
      (category === "all" || org.category === category) &&
      `${org.name} ${org.lead}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="FIND YOUR PEOPLE"
        title={
          profile.role === "manager"
            ? "Your community, connected."
            : "A place for every passion."
        }
        description="Meet the student organizations making campus life a little more meaningful."
      >
        {profile.role === "admin" && (
          <button
            className="button button-primary"
            onClick={() => openDialog({ type: "organization" })}
          >
            <Icon name="plus" size={17} />
            New organization
          </button>
        )}
      </PageHeader>
      <div className="summary-strip">
        <span>
          <strong>
            {
              scoped.organizations.filter((org) => org.status === "active")
                .length
            }
          </strong>{" "}
          active organizations
        </span>
        <span>
          <strong>
            {scoped.organizations.reduce((sum, org) => sum + org.members, 0)}
          </strong>{" "}
          memberships
        </span>
        <span>
          <strong>
            {new Set(scoped.organizations.map((org) => org.category)).size}
          </strong>{" "}
          interests, countless possibilities
        </span>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search organizations…"
          />
          <select
            aria-label="Organization category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {Array.from(
              new Set(scoped.organizations.map((org) => org.category)),
            ).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        {organizations.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Organization lead</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="table-identity">
                        <span className={`org-icon color-${org.color}`}>
                          {org.initials}
                        </span>
                        <div>
                          <button
                            className="text-button row-title"
                            onClick={() =>
                              openDialog({
                                type: "organization-detail",
                                id: org.id,
                              })
                            }
                          >
                            {org.name}
                          </button>
                          <span className="row-subtitle">
                            {
                              scoped.events.filter(
                                (event) =>
                                  event.organizationId === org.id &&
                                  event.status === "published",
                              ).length
                            }{" "}
                            published opportunities
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{org.category}</td>
                    <td>{org.members}</td>
                    <td>
                      <span className="assignee">
                        <span className="avatar avatar-small">
                          {initials(org.lead)}
                        </span>
                        {org.lead}
                      </span>
                    </td>
                    <td>
                      <Badge value={org.status} />
                    </td>
                    <td>
                      <button
                        className="button button-small button-secondary"
                        onClick={() =>
                          openDialog({
                            type:
                              profile.role === "student"
                                ? "organization-detail"
                                : "organization",
                            id: org.id,
                          })
                        }
                      >
                        {profile.role === "student" ? "Explore" : "Manage"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No organizations found" />
        )}
        <div className="panel-table-footer">
          Showing {organizations.length} organizations
        </div>
      </section>
    </>
  );
}

export function TasksPage() {
  const { scoped, openDialog } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("open");
  const tasks = scoped.tasks
    .filter(
      (task) =>
        (tab === "all" ||
          (tab === "open" ? task.status !== "done" : task.status === tab)) &&
        `${task.title} ${task.assignee}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.due.localeCompare(b.due));
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE MOMENTUM"
        title="Great things, one task at a time."
        description="Clear owners, clear next steps. Keep your campus plans moving."
      >
        <button
          className="button button-primary"
          onClick={() => openDialog({ type: "task" })}
        >
          <Icon name="plus" size={17} />
          Create task
        </button>
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "open",
              label: "Open tasks",
              count: scoped.tasks.filter((task) => task.status !== "done")
                .length,
            },
            { value: "in-progress", label: "In progress" },
            { value: "done", label: "Completed" },
            { value: "all", label: "All tasks" },
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks or assignees…"
          />
          <span className="muted small">Sorted by due date</span>
        </div>
        <TasksTable tasks={tasks} />
        <div className="panel-table-footer">Showing {tasks.length} tasks</div>
      </section>
    </>
  );
}

export function ApplicationsPage() {
  const { data, scoped, profile } = useCampus();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const student = profile.role === "student";
  const applications = scoped.applications
    .filter(
      (app) =>
        (tab === "all" || app.status === tab) &&
        `${app.studentName} ${data.events.find((event) => event.id === app.eventId)?.title}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader
        eyebrow={student ? "YOUR NEXT CHAPTER" : "OPENING DOORS"}
        title={
          student
            ? "Every opportunity, every update."
            : "A little review. A big next step."
        }
        description={
          student
            ? "Follow your applications from first hello to your next campus experience."
            : "Get to know the students ready to be part of your events and programs."
        }
      >
        {student ? (
          <Link href="/events" className="button button-primary">
            Find opportunities
            <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <button
            className="button button-secondary"
            onClick={() =>
              download(
                [
                  ["Student", "Email", "Opportunity", "Status", "Submitted"],
                  ...applications.map((app) => [
                    app.studentName,
                    app.email,
                    data.events.find((event) => event.id === app.eventId)
                      ?.title ?? "",
                    app.status,
                    app.createdAt,
                  ]),
                ],
                "campusops-applications.csv",
              )
            }
          >
            <Icon name="download" size={17} />
            Export CSV
          </button>
        )}
      </PageHeader>
      <section className="panel">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: "all",
              label: student ? "My applications" : "All applications",
              count: scoped.applications.length,
            },
            {
              value: "pending",
              label: "Pending",
              count: scoped.applications.filter(
                (app) => app.status === "pending",
              ).length,
            },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Not selected" },
            { value: "withdrawn", label: "Withdrawn" },
          ]}
        />
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              student
                ? "Search my applications…"
                : "Search students or opportunities…"
            }
          />
          <span className="muted small">Newest first</span>
        </div>
        <ApplicationsTable applications={applications} />
        <div className="panel-table-footer">
          Showing {applications.length} applications
        </div>
      </section>
    </>
  );
}

export function AnalyticsPage() {
  const { scoped } = useCampus();
  const completed = scoped.events.filter(
    (event) => event.status === "completed",
  );
  const reviewed = scoped.applications.filter((app) =>
    ["approved", "rejected"].includes(app.status),
  );
  const approved = reviewed.filter((app) => app.status === "approved").length;
  const done = scoped.tasks.filter((task) => task.status === "done").length;
  return (
    <>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="See the impact you’re making."
        description="A clearer view of participation, applications, and the work behind it all."
      >
        <button
          className="button button-secondary"
          onClick={() =>
            download(
              [
                [
                  "Organization",
                  "Members",
                  "Completed events",
                  "Attendance",
                  "Applications",
                  "Completed tasks",
                ],
                ...scoped.organizations.map((org) => [
                  org.name,
                  org.members,
                  completed.filter((event) => event.organizationId === org.id)
                    .length,
                  completed
                    .filter((event) => event.organizationId === org.id)
                    .reduce((sum, event) => sum + event.attendance, 0),
                  scoped.applications.filter((app) =>
                    scoped.events.some(
                      (event) =>
                        event.id === app.eventId &&
                        event.organizationId === org.id,
                    ),
                  ).length,
                  scoped.tasks.filter(
                    (task) =>
                      task.organizationId === org.id && task.status === "done",
                  ).length,
                ]),
              ],
              "campusops-report.csv",
            )
          }
        >
          <Icon name="download" size={17} />
          Export report
        </button>
      </PageHeader>
      <div className="stats-grid analytics-stats">
        {[
          {
            label: "Recorded attendance",
            value: completed.reduce((sum, event) => sum + event.attendance, 0),
            detail: `Across ${completed.length} completed events`,
          },
          {
            label: "Applications received",
            value: scoped.applications.length,
            detail: "All application statuses",
          },
          {
            label: "Approval rate",
            value: reviewed.length
              ? `${Math.round((approved / reviewed.length) * 100)}%`
              : "—",
            detail: `${approved} approved of ${reviewed.length} reviewed`,
          },
          {
            label: "Task completion",
            value: scoped.tasks.length
              ? `${Math.round((done / scoped.tasks.length) * 100)}%`
              : "—",
            detail: `${done} of ${scoped.tasks.length} tasks complete`,
          },
        ].map((item) => (
          <div className="stat-card" key={item.label}>
            <span className="muted">{item.label}</span>
            <strong className="stat-number">{item.value}</strong>
            <span className="muted small">{item.detail}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-bottom">
        <ParticipationChart />
        <section className="panel">
          <PanelHeader
            title="Application breakdown"
            description="Every application in your current workspace"
          />
          <div className="breakdown-list">
            {["pending", "approved", "rejected", "withdrawn"].map((status) => {
              const count = scoped.applications.filter(
                (app) => app.status === status,
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
        </section>
      </div>
      <section className="panel">
        <PanelHeader
          title="Organization impact"
          description="Attendance counts visits to completed events, not unique students."
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Members</th>
                <th>Completed events</th>
                <th>Total attendance</th>
                <th>Open tasks</th>
              </tr>
            </thead>
            <tbody>
              {scoped.organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="table-identity">
                      <span className={`org-icon color-${org.color}`}>
                        {org.initials}
                      </span>
                      <strong>{org.name}</strong>
                    </div>
                  </td>
                  <td>{org.members}</td>
                  <td>
                    {
                      completed.filter(
                        (event) => event.organizationId === org.id,
                      ).length
                    }
                  </td>
                  <td>
                    {completed
                      .filter((event) => event.organizationId === org.id)
                      .reduce((sum, event) => sum + event.attendance, 0)}
                  </td>
                  <td>
                    {
                      scoped.tasks.filter(
                        (task) =>
                          task.organizationId === org.id &&
                          task.status !== "done",
                      ).length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function ActivityPage() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR CAMPUS STORY"
        title="Look at you, getting involved."
        description="Your applications and updates, collected in one place."
      />
      <section className="panel activity-page">
        <PanelHeader
          title="Your activity timeline"
          description="Only your personal activity appears here."
        />
        <ActivityFeed limit={200} />
      </section>
    </>
  );
}

export function SettingsPage() {
  const { profile, account, context, university, accessLabel, data, reset } = useCampus();
  const [confirmReset, setConfirmReset] = useState(false);
  return <>
    <PageHeader eyebrow="ACCOUNT & ACCESS" title="One account. All your campus roles." description="Your university and approved memberships determine the tools available to you." />
    <section className="panel settings-panel"><PanelHeader title="Your account" description="Account permissions cannot be changed from the navigation bar." /><div className="settings-profile"><span className="avatar avatar-large avatar-green">{initials(profile.name)}</span><div><h3>{profile.name}</h3><p>{profile.email}</p></div><span className="role-pill"><Icon name="shield" size={16} />{accessLabel}</span></div></section>
    <section className="panel settings-panel"><PanelHeader title="University membership" description="Access is scoped to your university, including all records and reports." /><div className="membership-row"><span className="org-icon color-green"><Icon name="building" size={20} /></span><div><strong>{university.name}</strong><p>{university.location} ? {university.timeZone}</p></div><Badge value="active" /></div></section>
    <section className="panel settings-panel"><PanelHeader title="Organization memberships" description="Leading a club adds management access. Your student identity and personal applications stay the same." />{account.organizationMemberships.filter(item => item.universityId === university.id).map(item => <div className="membership-row" key={item.organizationId}><span className="org-icon color-purple"><Icon name="people" size={20} /></span><div><strong>{data.organizations.find(org => org.id === item.organizationId)?.name ?? "Organization"}</strong><p>{item.role === "manager" ? "Organization leader" : "Member"} ? Membership-based access</p></div><Badge value={item.status} /></div>)}</section>
    <section className="panel settings-panel"><PanelHeader title="How access works" /><div className="table-scroll"><table className="permissions-table"><thead><tr><th>Workspace</th><th>Access is granted by</th><th>What you can do</th></tr></thead><tbody><tr><td>My campus</td><td>Verified university membership</td><td>Explore events, apply, and follow your own activity</td></tr><tr><td>Manage organization</td><td>Approved leadership membership</td><td>Manage that organization?s events, tasks, and applicants</td></tr><tr><td>University administration</td><td>Authorized invitation</td><td>Manage operations across that university</td></tr></tbody></table></div><div className="settings-description"><p>Current workspace: <strong>{context.kind === "personal" ? "My campus" : context.kind === "organization" ? "Organization management" : "University administration"}</strong>. Moving between your spaces never changes your identity or grants new permissions.</p><p>You cannot review your own event application. Another authorized reviewer must make the decision.</p></div></section>
    <section className="panel settings-panel"><PanelHeader title="Local product preview" /><div className="settings-description"><p>You are using a sample account with a student membership and approved leadership access. Records stay in this browser. Real authentication, membership verification, and a shared database will be connected in the next implementation stage.</p><Link href="/sign-up" className="button button-secondary">Preview the signup journey<Icon name="arrow" size={15} /></Link><div className="reset-row"><div><strong>Reset local sample data</strong><p>Restore the sample account and records in this browser.</p></div><button className="button button-danger" onClick={() => setConfirmReset(true)}>Reset preview</button></div></div></section>
    {confirmReset && <Modal title="Reset this local preview?" description="This restores sample data in this browser. It does not change any real account or membership." onClose={() => setConfirmReset(false)}><div className="modal-footer"><button className="button button-secondary" onClick={() => setConfirmReset(false)}>Keep my changes</button><button className="button button-danger" onClick={async () => { await reset(); setConfirmReset(false); }}>Restore sample data</button></div></Modal>}
  </>;
}
