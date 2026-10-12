"use client";

import { useState } from "react";
import { useCampus } from "./campus-provider";
import { PanelHeader } from "./ui";
import { initials } from "@/lib/domain";

export function ParticipationChart() {
  const { scoped } = useCampus();
  const [period, setPeriod] = useState(6);
  const now = new Date();
  const months = Array.from({ length: period }, (_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - period + i + 1,
      1,
    );
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: date.toLocaleDateString("en-US", { month: "short" }),
      total: scoped.events
        .filter(
          (event) => event.status === "completed" && event.date.startsWith(key),
        )
        .reduce((sum, event) => sum + event.attendance, 0),
    };
  });
  const maximum = Math.max(20, ...months.map((month) => month.total));
  const ceiling = Math.ceil(maximum / 20) * 20;
  return (
    <section className="panel participation-panel">
      <PanelHeader
        title="Campus participation"
        description="Recorded attendance at completed events"
      >
        <select
          aria-label="Participation period"
          className="compact-select"
          value={period}
          onChange={(event) => setPeriod(Number(event.target.value))}
        >
          <option value={6}>Last 6 months</option>
          <option value={3}>Last 3 months</option>
        </select>
      </PanelHeader>
      <div className="chart-total">
        <strong>{months.reduce((sum, month) => sum + month.total, 0)}</strong>
        <span>event check-ins</span>
        <span className="chart-legend">
          <i />
          Attendance
        </span>
      </div>
      <div
        className="bar-chart"
        role="img"
        aria-label={months
          .map((month) => `${month.label}: ${month.total} attendees`)
          .join(", ")}
      >
        <div className="chart-y-axis">
          <span>{ceiling}</span>
          <span>{ceiling / 2}</span>
          <span>0</span>
        </div>
        <div className="chart-plot">
          <div className="chart-grid">
            <i />
            <i />
            <i />
          </div>
          <div className="chart-bars">
            {months.map((month, index) => (
              <div className="bar-column" key={month.label}>
                <div className="bar-space">
                  <span
                    className={`bar ${index === months.length - 1 ? "bar-current" : ""}`}
                    style={{
                      height: `${(month.total / ceiling) * 100}%`,
                      minHeight: month.total ? 5 : 0,
                    }}
                    title={`${month.label}: ${month.total} attendees`}
                  >
                    <span className="bar-value">{month.total}</span>
                  </span>
                </div>
                <span className="bar-label">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const { scoped } = useCampus();
  const activity = scoped.activity.slice(0, limit);
  return (
    <div className="activity-list">
      {activity.length ? (
        activity.map((item) => {
          const minutes = Math.max(
            0,
            Math.floor(
              (new Date().getTime() - new Date(item.createdAt).getTime()) /
                60_000,
            ),
          );
          const time =
            minutes < 1
              ? "Just now"
              : minutes < 60
                ? `${minutes}m ago`
                : minutes < 1440
                  ? `${Math.floor(minutes / 60)}h ago`
                  : `${Math.floor(minutes / 1440)}d ago`;
          return (
            <div key={item.id} className="activity-item">
              <span className="avatar avatar-small">
                {initials(item.actorName)}
              </span>
              <div>
                <p>
                  <strong>{item.actorName}</strong> {item.text}.
                </p>
                <time dateTime={item.createdAt}>{time}</time>
              </div>
            </div>
          );
        })
      ) : (
        <p className="muted">
          Your activity will appear here as you use the workspace.
        </p>
      )}
    </div>
  );
}
