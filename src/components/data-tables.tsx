"use client";

import { useCampus } from "./campus-provider";
import { Badge, EmptyState } from "./ui";
import Icon from "./icon";
import {
  approvedCount,
  dateOffset,
  eventKindLabel,
  formatDate,
  initials,
  type Application,
  type CampusEvent,
  type Task,
} from "@/lib/domain";

export function EventsTable({
  events,
  compact = false,
}: {
  events: CampusEvent[];
  compact?: boolean;
}) {
  const { data, profile, openDialog } = useCampus();
  if (!events.length)
    return (
      <EmptyState
        title="No opportunities to show"
        description="Try another filter, or check back for something new."
        icon="calendar"
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Event / program</th>
            <th>Date & time</th>
            {!compact && <th>Places</th>}
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const org = data.organizations.find(
              (org) => org.id === event.organizationId,
            );
            return (
              <tr key={event.id}>
                <td>
                  <div className="table-identity">
                    <span className={`org-icon color-${org?.color ?? "green"}`}>
                      <Icon
                        name={event.kind === "program" ? "book" : "calendar"}
                        size={18}
                      />
                    </span>
                    <div>
                      <button
                        className="text-button row-title"
                        onClick={() =>
                          openDialog({ type: "event-detail", id: event.id })
                        }
                      >
                        {event.title}
                      </button>
                      <span className="row-subtitle">
                        {org?.name}
                        {event.kind !== "event" &&
                          ` · ${eventKindLabel(event)}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="nowrap">
                  <span>{formatDate(event.date)}</span>
                  <span className="row-subtitle">{event.time}</span>
                </td>
                {!compact && (
                  <td>
                    <span>
                      {event.status === "completed"
                        ? event.attendance
                        : approvedCount(data, event.id)}
                      <span className="muted"> / {event.capacity}</span>
                    </span>
                    <div className="capacity-track">
                      <span
                        style={{
                          width: `${Math.min(100, ((event.status === "completed" ? event.attendance : approvedCount(data, event.id)) / event.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                )}
                <td>
                  <Badge value={event.status} />
                </td>
                <td>
                  <button
                    className={
                      compact
                        ? "icon-button"
                        : "button button-small button-secondary"
                    }
                    aria-label={`${profile.role === "student" ? "View" : "Edit"} ${event.title}`}
                    onClick={() =>
                      openDialog({
                        type:
                          compact || profile.role === "student"
                            ? "event-detail"
                            : "event",
                        id: event.id,
                      })
                    }
                  >
                    {compact ? (
                      <Icon name="chevron" size={17} />
                    ) : profile.role === "student" ? (
                      "View"
                    ) : (
                      "Edit"
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TasksTable({
  tasks,
  compact = false,
}: {
  tasks: Task[];
  compact?: boolean;
}) {
  const { data, run, openDialog } = useCampus();
  if (!tasks.length)
    return (
      <EmptyState
        title="A clear to-do list"
        description="There are no tasks matching this view."
        icon="tasks"
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            {!compact && <th>Assignee</th>}
            <th>Due date</th>
            <th>Priority</th>
            {!compact && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <div className="table-identity">
                  <button
                    className={`task-checkbox ${task.status === "done" ? "checked" : ""}`}
                    aria-label={`${task.status === "done" ? "Reopen" : "Complete"} ${task.title}`}
                    aria-pressed={task.status === "done"}
                    onClick={() =>
                      run(
                        {
                          type: "task-status",
                          id: task.id,
                          status: task.status === "done" ? "todo" : "done",
                        },
                        task.status === "done"
                          ? "Task reopened."
                          : "One more thing done. Task completed.",
                      )
                    }
                  >
                    {task.status === "done" && <Icon name="check" size={13} />}
                  </button>
                  <div>
                    <button
                      className={`text-button row-title ${task.status === "done" ? "completed-task" : ""}`}
                      onClick={() => openDialog({ type: "task", id: task.id })}
                    >
                      {task.title}
                    </button>
                    <span className="row-subtitle">
                      {
                        data.organizations.find(
                          (org) => org.id === task.organizationId,
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              </td>
              {!compact && (
                <td>
                  <span className="assignee">
                    <span className="avatar avatar-small">
                      {initials(task.assignee)}
                    </span>
                    {task.assignee}
                  </span>
                </td>
              )}
              <td
                className={
                  task.due < dateOffset(0) && task.status !== "done"
                    ? "overdue nowrap"
                    : "nowrap"
                }
              >
                {formatDate(task.due)}
                {task.due < dateOffset(0) && task.status !== "done" && (
                  <span className="row-subtitle overdue">Overdue</span>
                )}
              </td>
              <td>
                <Badge value={task.priority} />
              </td>
              {!compact && (
                <td>
                  <select
                    className="inline-select"
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    onChange={(event) =>
                      run(
                        {
                          type: "task-status",
                          id: task.id,
                          status: event.target.value as Task["status"],
                        },
                        "Task status updated.",
                      )
                    }
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  const { data, profile, openDialog } = useCampus();
  const student = profile.role === "student";
  if (!applications.length)
    return (
      <EmptyState
        title={
          student
            ? "Your next chapter starts here"
            : "No applications in this view"
        }
        description={
          student
            ? "Explore opportunities and apply to something that interests you."
            : "Try another filter to see reviewed applications."
        }
        icon="file"
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {!student && <th>Student</th>}
            <th>Opportunity</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const event = data.events.find((event) => event.id === app.eventId);
            return (
              <tr key={app.id}>
                {!student && (
                  <td>
                    <div className="table-identity">
                      <span className="avatar avatar-purple">
                        {initials(app.studentName)}
                      </span>
                      <div>
                        <strong className="row-title">{app.studentName}</strong>
                        <span className="row-subtitle">{app.email}</span>
                      </div>
                    </div>
                  </td>
                )}
                <td>
                  <button
                    className="text-button row-title"
                    onClick={() =>
                      openDialog({ type: "application", id: app.id })
                    }
                  >
                    {event?.title ?? "Archived opportunity"}
                  </button>
                  <span className="row-subtitle">
                    {
                      data.organizations.find(
                        (org) => org.id === event?.organizationId,
                      )?.name
                    }
                    {event?.status === "cancelled" ? " · Cancelled" : ""}
                  </span>
                </td>
                <td className="nowrap">
                  {new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>
                  <Badge value={app.status} />
                </td>
                <td>
                  <button
                    className="button button-small button-secondary"
                    onClick={() =>
                      openDialog({ type: "application", id: app.id })
                    }
                  >
                    {!student && app.status === "pending" ? "Review" : "View"}
                    <Icon name="arrow" size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
