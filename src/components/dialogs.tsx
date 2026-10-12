"use client";

import { useState, type FormEvent } from "react";
import { useCampus } from "./campus-provider";
import { Badge, Field, Modal } from "./ui";
import Icon from "./icon";
import {
  approvedCount,
  canApply,
  canManageOrganization,
  dateOffset,
  eventKindLabel,
  formatDate,
  initials,
  type CampusEvent,
  type Organization,
  type Task,
} from "@/lib/domain";

function FormFooter({ label = "Save changes" }: { label?: string }) {
  const { openDialog, error, pending } = useCampus();
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-footer">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => openDialog(null)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="button button-primary"
          disabled={pending}
        >
          {pending ? "Saving…" : label}
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </>
  );
}
function OrganizationSelect({
  value,
  disabled = false,
}: {
  value?: string;
  disabled?: boolean;
}) {
  const { scoped } = useCampus();
  return (
    <Field label="Organization">
      <select
        name="organizationId"
        defaultValue={value}
        disabled={disabled}
        required
      >
        {scoped.organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function EventForm({ id }: { id?: string }) {
  const { data, profile, university, run, openDialog } = useCampus();
  const existing = data.events.find((event) => event.id === id);
  const [status, setStatus] = useState<CampusEvent["status"]>(
    existing?.status ?? "published",
  );
  const [kind, setKind] = useState<CampusEvent["kind"]>(
    existing?.kind ?? "event",
  );
  const [customKind, setCustomKind] = useState(existing?.customKind ?? "");
  if (
    profile.role === "student" ||
    (existing && !canManageOrganization(profile, existing.organizationId))
  )
    return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const next: CampusEvent = {
      id: existing?.id ?? crypto.randomUUID(),
      universityId: profile.universityId,
      title: value("title"),
      organizationId: existing?.organizationId ?? value("organizationId"),
      kind,
      customKind: kind === "other" ? value("customKind") : undefined,
      description: value("description"),
      date: value("date"),
      time: value("time"),
      timeZone: university.timeZone,
      location: value("location"),
      capacity: Number(value("capacity")),
      status,
      attendance: status === "completed" ? Number(value("attendance")) : 0,
    };
    if (
      await run(
        { type: "save-event", event: next },
        existing ? "Opportunity updated." : "Your opportunity is ready.",
      )
    )
      openDialog(null);
  }
  return (
    <Modal
      title={existing ? "Edit opportunity" : "Create an opportunity"}
      onClose={() => openDialog(null)}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Title" wide>
            <input
              name="title"
              defaultValue={existing?.title}
              placeholder="Give your event or program a name"
              maxLength={100}
              required
            />
          </Field>
          <OrganizationSelect
            value={existing?.organizationId ?? profile.organizationId}
            disabled={!!existing}
          />
          <Field label="Type">
            <select
              name="kind"
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as CampusEvent["kind"])
              }
            >
              <option value="conference">Conference</option>
              <option value="event">Event</option>
              <option value="program">Program</option>
              <option value="hackathon">Hackathon</option>
              <option value="other">Other</option>
            </select>
          </Field>
          {kind === "other" && (
            <Field label="Custom type" wide>
              <input
                name="customKind"
                value={customKind}
                onChange={(event) => setCustomKind(event.target.value)}
                placeholder="Enter an opportunity type"
                maxLength={40}
                required
              />
            </Field>
          )}
          <Field label="Description" wide>
            <textarea
              name="description"
              rows={3}
              defaultValue={existing?.description}
              placeholder="What can students look forward to?"
              maxLength={2000}
              required
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              name="date"
              defaultValue={existing?.date ?? dateOffset(7)}
              required
            />
          </Field>
          <Field label={`Time (${university.timeZone})`}>
            <input
              type="time"
              name="time"
              defaultValue={existing?.time ?? "10:00"}
              required
            />
          </Field>
          <Field label="Location" wide>
            <input
              name="location"
              defaultValue={existing?.location}
              placeholder="Building, room, or online meeting details"
              maxLength={120}
              required
            />
          </Field>
          <Field label="Capacity">
            <input
              type="number"
              name="capacity"
              min={1}
              max={100000}
              defaultValue={existing?.capacity ?? 50}
              required
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CampusEvent["status"])
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          {status === "completed" && (
            <Field label="Recorded attendance">
              <input
                type="number"
                name="attendance"
                min={0}
                defaultValue={existing?.attendance ?? 0}
                required
              />
            </Field>
          )}
        </div>
        <FormFooter label={existing ? "Save changes" : "Create opportunity"} />
      </form>
    </Modal>
  );
}

function OrganizationForm({ id }: { id?: string }) {
  const { data, profile, run, openDialog } = useCampus();
  const existing = data.organizations.find((org) => org.id === id);
  if (
    existing
      ? !canManageOrganization(profile, existing.id)
      : profile.role !== "admin"
  )
    return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const organization: Organization = {
      id: existing?.id ?? crypto.randomUUID(),
      universityId: profile.universityId,
      name: value("name"),
      initials: initials(value("name")),
      category: value("category"),
      description: value("description"),
      lead: value("lead"),
      members: Number(value("members")),
      status:
        profile.role === "admin"
          ? (value("status") as Organization["status"])
          : existing!.status,
      color: existing?.color ?? "green",
    };
    if (
      await run(
        { type: "save-organization", organization },
        "Organization saved.",
      )
    )
      openDialog(null);
  }
  return (
    <Modal
      title={existing ? "Edit organization" : "A new campus community"}
      description="Give people a place to connect, create, and belong."
      onClose={() => openDialog(null)}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Organization name" wide>
            <input
              name="name"
              defaultValue={existing?.name}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Category">
            <select
              name="category"
              defaultValue={existing?.category ?? "Community"}
            >
              {[
                "Technology",
                "Arts & culture",
                "Community",
                "Professional",
                "Sports",
                "Academic",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Organization lead">
            <input
              name="lead"
              defaultValue={existing?.lead}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Description" wide>
            <textarea
              name="description"
              rows={3}
              defaultValue={existing?.description}
              maxLength={1500}
              required
            />
          </Field>
          <Field label="Members">
            <input
              name="members"
              type="number"
              min={0}
              defaultValue={existing?.members ?? 0}
              required
            />
          </Field>
          {profile.role === "admin" && (
            <Field label="Status">
              <select name="status" defaultValue={existing?.status ?? "active"}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </Field>
          )}
        </div>
        <FormFooter
          label={existing ? "Save organization" : "Create organization"}
        />
      </form>
    </Modal>
  );
}

function TaskForm({ id }: { id?: string }) {
  const { data, profile, openDialog, run } = useCampus();
  const existing = data.tasks.find((task) => task.id === id);
  if (
    profile.role === "student" ||
    (existing && !canManageOrganization(profile, existing.organizationId))
  )
    return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const task: Task = {
      id: existing?.id ?? crypto.randomUUID(),
      universityId: profile.universityId,
      title: value("title"),
      organizationId: existing?.organizationId ?? value("organizationId"),
      assignee: value("assignee"),
      due: value("due"),
      priority: value("priority") as Task["priority"],
      status: value("status") as Task["status"],
    };
    if (await run({ type: "save-task", task }, "Task saved.")) openDialog(null);
  }
  return (
    <Modal
      title={existing ? "Edit task" : "Make the next step clear"}
      description="A little coordination goes a long way."
      onClose={() => openDialog(null)}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Task title" wide>
            <input
              name="title"
              defaultValue={existing?.title}
              maxLength={120}
              required
            />
          </Field>
          <OrganizationSelect
            value={existing?.organizationId ?? profile.organizationId}
            disabled={!!existing}
          />
          <Field label="Assignee">
            <input
              name="assignee"
              defaultValue={existing?.assignee ?? profile.name}
              maxLength={80}
              required
            />
          </Field>
          <Field label="Due date">
            <input
              name="due"
              type="date"
              defaultValue={existing?.due ?? dateOffset(3)}
              required
            />
          </Field>
          <Field label="Priority">
            <select
              name="priority"
              defaultValue={existing?.priority ?? "medium"}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={existing?.status ?? "todo"}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </Field>
        </div>
        <FormFooter label={existing ? "Save task" : "Create task"} />
      </form>
    </Modal>
  );
}

function EventDetail({ id }: { id?: string }) {
  const { data, scoped, profile, openDialog, run, error } = useCampus();
  const event = scoped.events.find((item) => item.id === id);
  if (!event) return null;
  const org = data.organizations.find(
    (item) => item.id === event.organizationId,
  );
  const application = data.applications.find(
    (app) =>
      app.eventId === event.id &&
      app.studentId === profile.id &&
      app.status !== "withdrawn",
  );
  const eligible = canApply(data, event);
  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const motivation = String(
      new FormData(formEvent.currentTarget).get("motivation") ?? "",
    );
    if (
      await run(
        { type: "apply", eventId: event!.id, motivation },
        "Application submitted. You can track it in My applications.",
      )
    )
      openDialog(null);
  }
  return (
    <Modal
      title={event.title}
      description={org?.name}
      onClose={() => openDialog(null)}
    >
      <div className="modal-body">
        <div className="detail-badges">
          <Badge value={event.kind} label={eventKindLabel(event)} />
          <Badge value={event.status} />
        </div>
        <p className="detail-description">{event.description}</p>
        <div className="detail-facts">
          <span>
            <Icon name="calendar" size={18} />
            {formatDate(event.date, {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {event.time}
          </span>
          <span>
            <Icon name="location" size={18} />
            {event.location}
          </span>
          <span>
            <Icon name="people" size={18} />
            {event.status === "completed"
              ? `${event.attendance} attended`
              : `${approvedCount(data, event.id)} approved · ${event.capacity} places`}
          </span>
        </div>
        {profile.role === "student" &&
          (application ? (
            <div className="info-box">
              <strong>You have already applied</strong>
              <p>Track updates in My applications.</p>
              <Badge value={application.status} />
            </div>
          ) : eligible ? (
            <form onSubmit={submit} className="apply-form">
              <Field label="Tell us why you’d like to take part">
                <textarea
                  name="motivation"
                  placeholder="A short introduction is all you need…"
                  rows={3}
                  maxLength={1500}
                  required
                />
              </Field>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <p className="muted small">
                Applying as {profile.name} · {profile.email}
              </p>
              <button type="submit" className="button button-primary">
                Submit application
                <Icon name="arrow" size={16} />
              </button>
            </form>
          ) : (
            <div className="info-box">
              Applications are closed for this opportunity.
            </div>
          ))}
        {canManageOrganization(profile, event.organizationId) && (
          <div className="detail-actions">
            <button
              className="button button-primary"
              onClick={() => openDialog({ type: "event", id: event.id })}
            >
              <Icon name="edit" size={16} />
              Edit opportunity
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function OrganizationDetail({ id }: { id?: string }) {
  const { scoped, profile, openDialog } = useCampus();
  const org = scoped.organizations.find((item) => item.id === id);
  if (!org) return null;
  const events = scoped.events.filter(
    (event) => event.organizationId === org.id && event.status === "published",
  );
  return (
    <Modal
      title={org.name}
      description={org.category}
      onClose={() => openDialog(null)}
    >
      <div className="modal-body">
        <Badge value={org.status} />
        <p className="detail-description">{org.description}</p>
        <div className="detail-facts">
          <span>
            <Icon name="people" size={18} />
            {org.members} members
          </span>
          <span>
            <Icon name="shield" size={18} />
            Led by {org.lead}
          </span>
        </div>
        <h3 className="section-label">Published opportunities</h3>
        <div className="search-results">
          {events.length ? (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() =>
                  openDialog({ type: "event-detail", id: event.id })
                }
              >
                <div>
                  <strong>{event.title}</strong>
                  <span>
                    {formatDate(event.date)} · {eventKindLabel(event)}
                  </span>
                </div>
                <Icon name="arrow" size={16} />
              </button>
            ))
          ) : (
            <p className="muted">No published opportunities yet.</p>
          )}
        </div>
        {canManageOrganization(profile, org.id) && (
          <div className="detail-actions">
            <button
              className="button button-primary"
              onClick={() => openDialog({ type: "organization", id: org.id })}
            >
              Edit organization
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ApplicationDetail({ id }: { id?: string }) {
  const { scoped, data, profile, run, openDialog, error } = useCampus();
  const application = scoped.applications.find((item) => item.id === id);
  if (!application) return null;
  const event = data.events.find((item) => item.id === application.eventId);
  async function decide(status: "approved" | "rejected") {
    if (
      await run(
        { type: "review", id: application!.id, status },
        status === "approved"
          ? "Application approved."
          : "Application marked as not selected.",
      )
    )
      openDialog(null);
  }
  return (
    <Modal
      title={
        profile.role === "student" ? "Your application" : "Review application"
      }
      description={event?.title}
      onClose={() => openDialog(null)}
    >
      <div className="modal-body">
        <div className="applicant-detail">
          <span className="avatar avatar-purple">
            {initials(application.studentName)}
          </span>
          <div>
            <strong>{application.studentName}</strong>
            <p>{application.email}</p>
          </div>
          <Badge value={application.status} />
        </div>
        <h3 className="section-label">A little about the applicant</h3>
        <p className="application-letter">{application.motivation}</p>
        <p className="muted small">
          Submitted{" "}
          {new Date(application.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {event && (
          <p className="muted small">
            Opportunity status: <Badge value={event.status} />
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {profile.role !== "student" &&
          application.status === "pending" &&
          application.studentId !== profile.id &&
          event?.status === "published" && (
            <div className="detail-actions">
              <button
                className="button button-secondary"
                onClick={() => decide("rejected")}
              >
                Mark not selected
              </button>
              <button
                className="button button-primary"
                onClick={() => decide("approved")}
              >
                <Icon name="check" size={16} />
                Approve application
              </button>
            </div>
          )}
        {profile.role !== "student" &&
          application.studentId === profile.id &&
          application.status === "pending" && (
            <div className="info-box">
              Another authorized reviewer must decide on your application. You
              cannot approve or decline your own request.
            </div>
          )}
        {profile.role === "student" &&
          ["pending", "approved"].includes(application.status) &&
          event?.status !== "completed" && (
            <div className="detail-actions">
              <button
                className="button button-danger"
                onClick={async () => {
                  if (
                    await run(
                      { type: "withdraw", id: application.id },
                      "Application withdrawn.",
                    )
                  )
                    openDialog(null);
                }}
              >
                Withdraw application
              </button>
            </div>
          )}
      </div>
    </Modal>
  );
}

export default function Dialogs() {
  const { dialog } = useCampus();
  if (!dialog) return null;
  const components = {
    event: EventForm,
    organization: OrganizationForm,
    task: TaskForm,
    "event-detail": EventDetail,
    "organization-detail": OrganizationDetail,
    application: ApplicationDetail,
  };
  const Component = components[dialog.type];
  return (
    <Component key={`${dialog.type}-${dialog.id ?? "new"}`} id={dialog.id} />
  );
}
