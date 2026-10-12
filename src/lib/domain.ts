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
  kind: "event" | "program";
  description: string;
  date: string;
  time: string;
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

export const profiles: Record<Role, Profile> = {
  admin: {
    id: "user-admin",
    universityId: "oau",
    name: "Alex Morgan",
    email: "alex@campus.example",
    role: "admin",
  },
  manager: {
    id: "user-manager",
    universityId: "oau",
    name: "Damilola Adeyemi",
    email: "damilola@example.test",
    role: "manager",
    organizationId: "org-tech",
  },
  student: {
    id: "user-student",
    universityId: "oau",
    name: "Sam Taylor",
    email: "sam@campus.example",
    role: "student",
  },
};
export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Organization manager",
  student: "Student",
};

export function dateOffset(days: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createSeed(now = new Date()): Workspace {
  const d = (days: number) => dateOffset(days, now);
  const at = (hours: number) =>
    new Date(now.getTime() - hours * 3_600_000).toISOString();
  const seed: {
    organizations: Omit<Organization, "universityId">[];
    events: Omit<CampusEvent, "universityId">[];
    tasks: Omit<Task, "universityId">[];
    applications: Omit<Application, "universityId">[];
    activity: Omit<Activity, "universityId">[];
  } = {
    organizations: [
      {
        id: "org-tech",
        name: "Tech & Innovation Club",
        initials: "TI",
        category: "Technology",
        lead: "Damilola Adeyemi",
        members: 128,
        status: "active",
        color: "green",
        description:
          "A community of curious builders turning big ideas into useful things. Join workshops, hackathons, and conversations about what comes next.",
      },
      {
        id: "org-arts",
        name: "Creative Arts Society",
        initials: "CA",
        category: "Arts & culture",
        lead: "Olivia Chen",
        members: 86,
        status: "active",
        color: "purple",
        description:
          "Make room for creativity. We bring together artists, designers, performers, and anyone who loves to create.",
      },
      {
        id: "org-impact",
        name: "Campus Impact",
        initials: "CI",
        category: "Community",
        lead: "Noah Williams",
        members: 104,
        status: "active",
        color: "orange",
        description:
          "Small actions, lasting change. A student-led community for volunteering, sustainability, and local partnerships.",
      },
      {
        id: "org-business",
        name: "Entrepreneurs Network",
        initials: "EN",
        category: "Professional",
        lead: "Amara Okafor",
        members: 72,
        status: "active",
        color: "blue",
        description:
          "Find your co-founders, test an idea, and learn from people building their own path.",
      },
      {
        id: "org-sports",
        name: "Campus Sports Collective",
        initials: "SC",
        category: "Sports",
        lead: "Ethan Davis",
        members: 156,
        status: "active",
        color: "pink",
        description:
          "Move together. Friendly tournaments, open training sessions, and a place for every level of athlete.",
      },
      {
        id: "org-debate",
        name: "Debate & Dialogue",
        initials: "DD",
        category: "Academic",
        lead: "Maya Patel",
        members: 48,
        status: "paused",
        color: "slate",
        description:
          "A space for thoughtful debate, public speaking, and perspectives that challenge your own.",
      },
    ],
    events: [
      {
        id: "event-hack",
        title: "Build Together: Campus Hackathon",
        organizationId: "org-tech",
        kind: "event",
        description:
          "Bring an idea, find a team, and build something that makes campus life better. All experience levels are welcome. Lunch and mentoring are included.",
        date: d(4),
        time: "09:00",
        location: "Innovation Hub · Room 201",
        capacity: 80,
        status: "published",
        attendance: 0,
      },
      {
        id: "event-arts",
        title: "The Creative Exchange",
        organizationId: "org-arts",
        kind: "event",
        description:
          "An evening of student art, live performances, and creative conversations. Come ready to share your work or discover something new.",
        date: d(6),
        time: "16:00",
        location: "Student Centre · Gallery",
        capacity: 120,
        status: "published",
        attendance: 0,
      },
      {
        id: "event-impact",
        title: "A Greener Campus",
        organizationId: "org-impact",
        kind: "event",
        description:
          "Help us plant the next chapter of our campus garden. Meet at the east entrance; tools and refreshments provided.",
        date: d(8),
        time: "08:30",
        location: "East Campus Garden",
        capacity: 40,
        status: "published",
        attendance: 0,
      },
      {
        id: "event-founder",
        title: "Founders Launchpad",
        organizationId: "org-business",
        kind: "program",
        description:
          "A four-week program to take your idea from a sketch to a first pitch. Work with mentors and a supportive cohort of student founders.",
        date: d(12),
        time: "14:00",
        location: "Business School · Studio B",
        capacity: 24,
        status: "published",
        attendance: 0,
      },
      {
        id: "event-web",
        title: "Web Development Fellowship",
        organizationId: "org-tech",
        kind: "program",
        description:
          "Learn by building. A six-week practical fellowship covering the foundations of accessible, thoughtful web development.",
        date: d(15),
        time: "15:00",
        location: "Computing Lab · Room 104",
        capacity: 30,
        status: "published",
        attendance: 0,
      },
      {
        id: "event-sports",
        title: "Interfaculty Games",
        organizationId: "org-sports",
        kind: "event",
        description:
          "A day of friendly competition, team spirit, and campus connection. Final schedule coming soon.",
        date: d(20),
        time: "09:00",
        location: "University Sports Complex",
        capacity: 200,
        status: "draft",
        attendance: 0,
      },
      ...[24, 42, 35, 58, 46, 68].map((attendance, index): Omit<CampusEvent, "universityId"> => ({
        id: `event-past-${index}`,
        title: [
          "Intro to Open Source",
          "Design After Hours",
          "Community Clean-up",
          "Build Night",
          "Creative Showcase",
          "Product Design Workshop",
        ][index],
        organizationId: [
          "org-tech",
          "org-arts",
          "org-impact",
          "org-tech",
          "org-arts",
          "org-tech",
        ][index],
        kind: "event",
        description: "A completed campus community event.",
        date: d(-150 + index * 28),
        time: "14:00",
        location: "Student Centre",
        capacity: 100,
        status: "completed",
        attendance,
      })),
    ],
    tasks: [
      {
        id: "task-1",
        title: "Confirm hackathon mentors",
        organizationId: "org-tech",
        assignee: "Damilola Adeyemi",
        due: d(1),
        priority: "high",
        status: "in-progress",
      },
      {
        id: "task-2",
        title: "Finalize exhibition floor plan",
        organizationId: "org-arts",
        assignee: "Olivia Chen",
        due: d(2),
        priority: "medium",
        status: "todo",
      },
      {
        id: "task-3",
        title: "Send volunteer briefing",
        organizationId: "org-impact",
        assignee: "Noah Williams",
        due: d(3),
        priority: "medium",
        status: "todo",
      },
      {
        id: "task-4",
        title: "Book computing lab",
        organizationId: "org-tech",
        assignee: "Damilola Adeyemi",
        due: d(2),
        priority: "high",
        status: "todo",
      },
      {
        id: "task-5",
        title: "Publish fellowship curriculum",
        organizationId: "org-tech",
        assignee: "Damilola Adeyemi",
        due: d(7),
        priority: "low",
        status: "done",
      },
      {
        id: "task-6",
        title: "Confirm founder panel",
        organizationId: "org-business",
        assignee: "Amara Okafor",
        due: d(-1),
        priority: "high",
        status: "in-progress",
      },
    ],
    applications: [
      {
        id: "app-1",
        eventId: "event-hack",
        studentId: "user-riley",
        studentName: "Riley Johnson",
        email: "riley@campus.example",
        motivation:
          "I would love to build a better way for students to find study groups.",
        status: "pending",
        createdAt: at(1),
      },
      {
        id: "app-2",
        eventId: "event-web",
        studentId: "user-casey",
        studentName: "Casey Adams",
        email: "casey@campus.example",
        motivation:
          "I want to build accessible websites for community organizations.",
        status: "pending",
        createdAt: at(3),
      },
      {
        id: "app-3",
        eventId: "event-arts",
        studentId: "user-student",
        studentName: "Sam Taylor",
        email: "sam@campus.example",
        motivation:
          "I am excited to share my photography and meet other creatives.",
        status: "approved",
        createdAt: at(24),
      },
      {
        id: "app-4",
        eventId: "event-founder",
        studentId: "user-student",
        studentName: "Sam Taylor",
        email: "sam@campus.example",
        motivation:
          "I would like to explore an idea for a student book exchange.",
        status: "pending",
        createdAt: at(18),
      },
      {
        id: "app-5",
        eventId: "event-hack",
        studentId: "user-drew",
        studentName: "Drew Wilson",
        email: "drew@campus.example",
        motivation:
          "Looking forward to working with a team on my first hackathon.",
        status: "approved",
        createdAt: at(30),
      },
      {
        id: "app-6",
        eventId: "event-impact",
        studentId: "user-avery",
        studentName: "Avery Kim",
        email: "avery@campus.example",
        motivation:
          "I volunteer with the community garden and would love to help.",
        status: "pending",
        createdAt: at(5),
      },
    ],
    activity: [
      {
        id: "activity-1",
        actorId: "user-riley",
        actorName: "Riley Johnson",
        organizationId: "org-tech",
        text: "applied to Build Together: Campus Hackathon",
        createdAt: at(1),
      },
      {
        id: "activity-2",
        actorId: "user-manager",
        actorName: "Damilola Adeyemi",
        organizationId: "org-tech",
        text: "published Web Development Fellowship",
        createdAt: at(2),
      },
      {
        id: "activity-3",
        actorId: "user-casey",
        actorName: "Casey Adams",
        organizationId: "org-tech",
        text: "applied to Web Development Fellowship",
        createdAt: at(3),
      },
      {
        id: "activity-4",
        actorId: "user-student",
        actorName: "Sam Taylor",
        organizationId: "org-business",
        text: "applied to Founders Launchpad",
        createdAt: at(18),
      },
      {
        id: "activity-5",
        actorId: "user-student",
        actorName: "Sam Taylor",
        organizationId: "org-arts",
        text: "received an approved place at The Creative Exchange",
        createdAt: at(24),
      },
    ],
  };
  const tenant = <T,>(records: T[]) => records.map(record => ({ ...record, universityId: "oau" }));
  return { version: 2, organizations: tenant(seed.organizations), events: tenant(seed.events), tasks: tenant(seed.tasks), applications: tenant(seed.applications), activity: tenant(seed.activity) };
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
    organizations: state.organizations.filter(item => item.universityId === profile.universityId),
    events: state.events.filter(item => item.universityId === profile.universityId),
    tasks: state.tasks.filter(item => item.universityId === profile.universityId),
    applications: state.applications.filter(item => item.universityId === profile.universityId),
    activity: state.activity.filter(item => item.universityId === profile.universityId),
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
    new Date(`${event.date}T${event.time}`).getTime() > now.getTime() &&
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
  const assertTenant = (record: { universityId: string } | undefined) => requireCondition(record?.universityId === profile.universityId, "This record is outside your university.");
  let next = state;
  let text = "";
  let organizationId: string | undefined;
  let activityActor = profile;
  const assertManager = (id: string) => {
    assertTenant(state.organizations.find(org => org.id === id));
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
      ["published", "draft", "completed", "cancelled"].includes(event.status) &&
        ["event", "program"].includes(event.kind),
      "Invalid event type or status.",
    );
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
      requireCondition(application.studentId !== profile.id, "You cannot review your own application. Another authorized reviewer must decide.");
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
    "en-US",
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
