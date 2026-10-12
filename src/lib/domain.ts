import { campusDate, campusInstant } from "./calendar.ts";

export type Role = "admin" | "manager" | "student";
export type Profile = {
  id: string;
  universityId: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
};
export type Organization = {
  id: string;
  universityId: string;
  name: string;
  initials: string;
  category: string;
  description: string;
  lead: string;
  members: number;
  status: "active" | "paused";
  color: string;
};
export type CampusEvent = {
  id: string;
  universityId: string;
  title: string;
  organizationId: string;
  kind: "conference" | "event" | "program" | "hackathon" | "other";
  customKind?: string;
  description: string;
  date: string;
  time: string;
  timeZone: string;
  location: string;
  capacity: number;
  status: "published" | "draft" | "completed" | "cancelled";
  attendance: number;
};
export type Task = {
  id: string;
  universityId: string;
  title: string;
  organizationId: string;
  assignee: string;
  due: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
};
export type Application = {
  id: string;
  universityId: string;
  eventId: string;
  studentId: string;
  studentName: string;
  email: string;
  motivation: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  createdAt: string;
};
export type Activity = {
  id: string;
  universityId: string;
  performedBy?: string;
  actorId: string;
  actorName: string;
  organizationId?: string;
  text: string;
  createdAt: string;
};
export type Workspace = {
  version: 2;
  organizations: Organization[];
  events: CampusEvent[];
  tasks: Task[];
  applications: Application[];
  activity: Activity[];
};

export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Organization manager",
  student: "Student",
};

export function dateOffset(days: number, now = new Date()) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return campusDate(date);
}

export function eventStartTime(event: CampusEvent) {
  return campusInstant(event.date, event.time, event.timeZone);
}

export function eventKindLabel(
  event: Pick<CampusEvent, "kind" | "customKind">,
) {
  if (event.kind === "other") return event.customKind?.trim() || "Other";
  return event.kind[0].toUpperCase() + event.kind.slice(1);
}

export function canManageOrganization(
  profile: Profile,
  organizationId: string,
) {
  return (
    profile.role === "admin" ||
    (profile.role === "manager" && profile.organizationId === organizationId)
  );
}

export function selectWorkspace(state: Workspace, profile: Profile) {
  const tenant = {
    ...state,
    organizations: state.organizations.filter(
      (item) => item.universityId === profile.universityId,
    ),
    events: state.events.filter(
      (item) => item.universityId === profile.universityId,
    ),
    tasks: state.tasks.filter(
      (item) => item.universityId === profile.universityId,
    ),
    applications: state.applications.filter(
      (item) => item.universityId === profile.universityId,
    ),
    activity: state.activity.filter(
      (item) => item.universityId === profile.universityId,
    ),
  };
  const events = tenant.events.filter(
    (event) =>
      profile.role === "admin" ||
      (profile.role === "manager"
        ? event.organizationId === profile.organizationId
        : event.status !== "draft"),
  );
  return {
    organizations: tenant.organizations.filter(
      (org) =>
        profile.role === "admin" ||
        (profile.role === "manager"
          ? org.id === profile.organizationId
          : org.status === "active"),
    ),
    events,
    tasks: tenant.tasks.filter((task) =>
      canManageOrganization(profile, task.organizationId),
    ),
    applications: tenant.applications.filter((application) =>
      profile.role === "student"
        ? application.studentId === profile.id
        : events.some((event) => event.id === application.eventId),
    ),
    activity: tenant.activity.filter(
      (activity) =>
        profile.role === "admin" ||
        (profile.role === "student"
          ? activity.actorId === profile.id
          : activity.organizationId === profile.organizationId),
    ),
  };
}

export type Command =
  | { type: "save-organization"; organization: Organization }
  | { type: "save-event"; event: CampusEvent }
  | { type: "save-task"; task: Task }
  | { type: "task-status"; id: string; status: Task["status"] }
  | { type: "apply"; eventId: string; motivation: string }
  | { type: "review"; id: string; status: "approved" | "rejected" }
  | { type: "withdraw"; id: string };

function requireCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}
function required(value: string, label: string, max = 200) {
  requireCondition(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    `${label} is required and must be under ${max + 1} characters.`,
  );
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function approvedCount(state: Workspace, eventId: string) {
  return state.applications.filter(
    (application) =>
      application.eventId === eventId && application.status === "approved",
  ).length;
}
export function canApply(
  state: Workspace,
  event: CampusEvent,
  now = new Date(),
) {
  return (
    event.status === "published" &&
    eventStartTime(event) > now.getTime() &&
    state.organizations.some(
      (org) => org.id === event.organizationId && org.status === "active",
    ) &&
    approvedCount(state, event.id) < event.capacity
  );
}

// These rules model the demo's workflows. Production authorization must also run on a trusted server.
export function applyCommand(
  state: Workspace,
  profile: Profile,
  command: Command,
  now = new Date(),
): Workspace {
  requireCondition(!!profile.universityId, "A university context is required.");
  const assertTenant = (record: { universityId: string } | undefined) =>
    requireCondition(
      record?.universityId === profile.universityId,
      "This record is outside your university.",
    );
  let next = state;
  let text = "";
  let organizationId: string | undefined;
  let activityActor = profile;
  const assertManager = (id: string) => {
    assertTenant(state.organizations.find((org) => org.id === id));
    requireCondition(
      state.organizations.some((org) => org.id === id),
      "Organization not found.",
    );
    requireCondition(
      canManageOrganization(profile, id),
      "You do not have permission to manage this organization.",
    );
  };
  if (command.type === "save-organization") {
    const org = command.organization;
    assertTenant(org);
    const existing = state.organizations.find((item) => item.id === org.id);
    if (existing) assertTenant(existing);
    requireCondition(
      existing
        ? canManageOrganization(profile, org.id)
        : profile.role === "admin",
      "Only administrators can create organizations.",
    );
    requireCondition(
      profile.role === "admin" || existing?.status === org.status,
      "Only administrators can change organization status.",
    );
    required(org.name, "Organization name", 80);
    required(org.description, "Description", 1500);
    required(org.lead, "Lead", 80);
    required(org.category, "Category", 60);
    requireCondition(
      ["active", "paused"].includes(org.status),
      "Invalid organization status.",
    );
    requireCondition(
      Number.isInteger(org.members) && org.members >= 0,
      "Member count must be a non-negative whole number.",
    );
    requireCondition(
      !state.organizations.some(
        (item) =>
          item.id !== org.id &&
          item.name.toLowerCase() === org.name.toLowerCase(),
      ),
      "An organization with this name already exists.",
    );
    next = {
      ...state,
      organizations: existing
        ? state.organizations.map((item) => (item.id === org.id ? org : item))
        : [...state.organizations, org],
    };
    text = `${existing ? "updated" : "created"} ${org.name}`;
    organizationId = org.id;
  } else if (command.type === "save-event") {
    const event = command.event;
    assertTenant(event);
    const existing = state.events.find((item) => item.id === event.id);
    if (existing) assertTenant(existing);
    assertManager(event.organizationId);
    if (existing) {
      assertManager(existing.organizationId);
      requireCondition(
        existing.organizationId === event.organizationId,
        "An existing event cannot move to another organization.",
      );
    }
    required(event.title, "Title", 100);
    required(event.description, "Description", 2000);
    required(event.location, "Location", 120);
    requireCondition(
      validDate(event.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time),
      "Enter a valid date and time.",
    );
    requireCondition(
      Number.isFinite(eventStartTime(event)),
      "Enter a valid university timezone.",
    );
    requireCondition(
      ["published", "draft", "completed", "cancelled"].includes(event.status) &&
        ["conference", "event", "program", "hackathon", "other"].includes(
          event.kind,
        ),
      "Invalid event type or status.",
    );
    if (event.kind === "other")
      required(event.customKind ?? "", "Custom event type", 40);
    requireCondition(
      Number.isInteger(event.capacity) &&
        event.capacity > 0 &&
        event.capacity >= approvedCount(state, event.id),
      "Capacity must be positive and cannot be below approved registrations.",
    );
    requireCondition(
      event.status !== "published" ||
        state.organizations.some(
          (org) => org.id === event.organizationId && org.status === "active",
        ),
      "Reactivate this organization before publishing an event.",
    );
    requireCondition(
      event.status !== "draft" ||
        !state.applications.some(
          (app) =>
            app.eventId === event.id &&
            ["pending", "approved"].includes(app.status),
        ),
      "An event with active applications cannot return to draft. Cancel it instead.",
    );
    requireCondition(
      Number.isInteger(event.attendance) &&
        event.attendance >= 0 &&
        event.attendance <= event.capacity,
      "Attendance must be between zero and capacity.",
    );
    requireCondition(
      event.status === "completed" || event.attendance === 0,
      "Attendance can only be recorded for completed events.",
    );
    next = {
      ...state,
      events: existing
        ? state.events.map((item) => (item.id === event.id ? event : item))
        : [...state.events, event],
    };
    text = `${existing ? "updated" : "created"} ${event.title}`;
    organizationId = event.organizationId;
  } else if (command.type === "save-task") {
    const task = command.task;
    assertTenant(task);
    assertManager(task.organizationId);
    const existing = state.tasks.find((item) => item.id === task.id);
    if (existing) assertTenant(existing);
    if (existing) {
      assertManager(existing.organizationId);
      requireCondition(
        existing.organizationId === task.organizationId,
        "An existing task cannot move to another organization.",
      );
    }
    required(task.title, "Task title", 120);
    required(task.assignee, "Assignee", 80);
    requireCondition(validDate(task.due), "Enter a valid due date.");
    requireCondition(
      ["high", "medium", "low"].includes(task.priority) &&
        ["todo", "in-progress", "done"].includes(task.status),
      "Invalid task priority or status.",
    );
    next = {
      ...state,
      tasks: existing
        ? state.tasks.map((item) => (item.id === task.id ? task : item))
        : [...state.tasks, task],
    };
    text = `${existing ? "updated" : "created"} task: ${task.title}`;
    organizationId = task.organizationId;
  } else if (command.type === "task-status") {
    const task = state.tasks.find((item) => item.id === command.id);
    requireCondition(task, "Task not found.");
    assertTenant(task);
    assertManager(task.organizationId);
    requireCondition(
      ["todo", "in-progress", "done"].includes(command.status),
      "Invalid task status.",
    );
    next = {
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === task.id ? { ...item, status: command.status } : item,
      ),
    };
    text = `${command.status === "done" ? "completed" : "updated"} task: ${task.title}`;
    organizationId = task.organizationId;
  } else if (command.type === "apply") {
    requireCondition(
      profile.role === "student",
      "Only students can submit applications.",
    );
    const event = state.events.find((item) => item.id === command.eventId);
    assertTenant(event);
    requireCondition(
      event && canApply(state, event, now),
      "This opportunity is no longer accepting applications.",
    );
    requireCondition(
      !state.applications.some(
        (app) =>
          app.eventId === event.id &&
          app.studentId === profile.id &&
          app.status !== "withdrawn",
      ),
      "You have already applied to this opportunity.",
    );
    required(command.motivation, "Your introduction", 1500);
    const application: Application = {
      id: crypto.randomUUID(),
      universityId: profile.universityId,
      eventId: event.id,
      studentId: profile.id,
      studentName: profile.name,
      email: profile.email,
      motivation: command.motivation.trim(),
      status: "pending",
      createdAt: now.toISOString(),
    };
    next = { ...state, applications: [application, ...state.applications] };
    text = `applied to ${event.title}`;
    organizationId = event.organizationId;
  } else {
    const application = state.applications.find(
      (item) => item.id === command.id,
    );
    requireCondition(application, "Application not found.");
    assertTenant(application);
    const event = state.events.find((item) => item.id === application.eventId);
    requireCondition(event, "Event not found.");
    assertTenant(event);
    if (command.type === "withdraw") {
      requireCondition(
        profile.role === "student" && application.studentId === profile.id,
        "You can only withdraw your own applications.",
      );
      requireCondition(
        ["pending", "approved"].includes(application.status) &&
          event.status !== "completed",
        "This application cannot be withdrawn.",
      );
      next = {
        ...state,
        applications: state.applications.map((item) =>
          item.id === application.id ? { ...item, status: "withdrawn" } : item,
        ),
      };
      text = `withdrew an application to ${event.title}`;
    } else {
      assertManager(event.organizationId);
      requireCondition(
        application.studentId !== profile.id,
        "You cannot review your own application. Another authorized reviewer must decide.",
      );
      requireCondition(
        application.status === "pending",
        "This application has already been reviewed.",
      );
      requireCondition(
        event.status === "published",
        "Only applications for published opportunities can be reviewed.",
      );
      requireCondition(
        command.status === "approved" || command.status === "rejected",
        "Invalid review decision.",
      );
      requireCondition(
        command.status !== "approved" ||
          approvedCount(state, event.id) < event.capacity,
        "This opportunity has reached capacity.",
      );
      next = {
        ...state,
        applications: state.applications.map((item) =>
          item.id === application.id
            ? { ...item, status: command.status }
            : item,
        ),
      };
      text = `received ${command.status === "approved" ? "an approved place" : "an application decision"} for ${event.title}`;
      activityActor = {
        id: application.studentId,
        universityId: profile.universityId,
        name: application.studentName,
        email: application.email,
        role: "student",
      };
    }
    organizationId = event.organizationId;
  }
  return {
    ...next,
    activity: [
      {
        id: crypto.randomUUID(),
        universityId: profile.universityId,
        performedBy: profile.id,
        actorId: activityActor.id,
        actorName: activityActor.name,
        organizationId,
        text,
        createdAt: now.toISOString(),
      },
      ...next.activity,
    ].slice(0, 200),
  };
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-NG",
    options ?? { month: "short", day: "numeric" },
  );
}
export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function exportCsv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value);
          const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
