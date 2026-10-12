"use client";

import { useCampus } from "@/components/campus-provider";
import Icon from "@/components/icon";
import { Badge, PageHeader, PanelHeader } from "@/components/ui";
import { ParticipationChart } from "@/components/analytics";
import { download } from "@/components/record-controls";

export default function AnalyticsPage() {
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
