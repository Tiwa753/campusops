import { createSeed, profiles } from "../src/lib/preview/seed.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyCommand,
  approvedCount,
  canApply,
  exportCsv,
  selectWorkspace,
} from "../src/lib/domain.ts";

const now = new Date("2026-10-12T10:00:00Z");
const seed = () => createSeed(now);

test("each role sees only its records", () => {
  const state = seed();
  const manager = selectWorkspace(state, profiles.manager);
  assert.equal(manager.organizations.length, 1);
  assert.ok(
    manager.events.every((event) => event.organizationId === "org-tech"),
  );
  assert.ok(manager.tasks.every((task) => task.organizationId === "org-tech"));
  assert.ok(
    manager.applications.every((app) =>
      manager.events.some((event) => event.id === app.eventId),
    ),
  );
  const student = selectWorkspace(state, profiles.student);
  assert.ok(
    student.applications.every((app) => app.studentId === profiles.student.id),
  );
  assert.ok(
    student.activity.every((item) => item.actorId === profiles.student.id),
  );
  assert.equal(student.tasks.length, 0);
  assert.ok(student.events.every((event) => event.status !== "draft"));
  assert.equal(
    selectWorkspace(state, profiles.admin).organizations.length,
    state.organizations.length,
  );
});
test("managers cannot edit or take ownership of another organization's events", () => {
  const state = seed();
  const event = state.events.find((event) => event.id === "event-arts");
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.manager,
        { type: "save-event", event: { ...event, title: "Changed" } },
        now,
      ),
    /permission/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.manager,
        { type: "save-event", event: { ...event, organizationId: "org-tech" } },
        now,
      ),
    /permission/,
  );
});
test("manager organization changes are scoped and status changes require admin", () => {
  const state = seed();
  assert.throws(() =>
    applyCommand(
      state,
      profiles.manager,
      {
        type: "save-organization",
        organization: { ...state.organizations[1], name: "Changed" },
      },
      now,
    ),
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.manager,
        {
          type: "save-organization",
          organization: { ...state.organizations[0], status: "paused" },
        },
        now,
      ),
    /administrators/,
  );
  const changed = applyCommand(
    state,
    profiles.manager,
    {
      type: "save-organization",
      organization: { ...state.organizations[0], description: "A new mission" },
    },
    now,
  );
  assert.equal(changed.organizations[0].description, "A new mission");
});
test("students cannot create records, review applications, or manage tasks", () => {
  const state = seed();
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.student,
        { type: "save-event", event: state.events[0] },
        now,
      ),
    /permission/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.student,
        { type: "save-task", task: state.tasks[0] },
        now,
      ),
    /permission/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.student,
        { type: "review", id: "app-1", status: "approved" },
        now,
      ),
    /permission/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.manager,
        { type: "task-status", id: "task-2", status: "done" },
        now,
      ),
    /permission/,
  );
});
test("student application flows to manager review and back to personal activity", () => {
  const state = seed();
  const applied = applyCommand(
    state,
    profiles.student,
    {
      type: "apply",
      eventId: "event-web",
      motivation: "I want to learn by building.",
    },
    now,
  );
  const app = applied.applications[0];
  assert.equal(app.status, "pending");
  assert.equal(app.studentId, profiles.student.id);
  const reviewed = applyCommand(
    applied,
    profiles.manager,
    { type: "review", id: app.id, status: "approved" },
    now,
  );
  assert.equal(reviewed.applications[0].status, "approved");
  assert.match(
    selectWorkspace(reviewed, profiles.student).activity[0].text,
    /approved place/,
  );
  assert.equal(
    state.applications.length,
    6,
    "commands must not mutate the original state",
  );
});
test("duplicate applications are blocked and withdrawn applications can be resubmitted", () => {
  const applied = applyCommand(
    seed(),
    profiles.student,
    { type: "apply", eventId: "event-hack", motivation: "I enjoy building." },
    now,
  );
  assert.throws(
    () =>
      applyCommand(
        applied,
        profiles.student,
        { type: "apply", eventId: "event-hack", motivation: "Again" },
        now,
      ),
    /already applied/,
  );
  const withdrawn = applyCommand(
    applied,
    profiles.student,
    { type: "withdraw", id: applied.applications[0].id },
    now,
  );
  assert.equal(withdrawn.applications[0].status, "withdrawn");
  const resubmitted = applyCommand(
    withdrawn,
    profiles.student,
    { type: "apply", eventId: "event-hack", motivation: "I can attend now." },
    now,
  );
  assert.equal(resubmitted.applications[0].status, "pending");
});
test("student cannot withdraw another student's application", () => {
  assert.throws(
    () =>
      applyCommand(
        seed(),
        profiles.student,
        { type: "withdraw", id: "app-1" },
        now,
      ),
    /own applications/,
  );
});
test("manager cannot review other organizations or review an application twice", () => {
  assert.throws(
    () =>
      applyCommand(
        seed(),
        profiles.manager,
        { type: "review", id: "app-6", status: "approved" },
        now,
      ),
    /permission/,
  );
  const approved = applyCommand(
    seed(),
    profiles.manager,
    { type: "review", id: "app-1", status: "approved" },
    now,
  );
  assert.throws(
    () =>
      applyCommand(
        approved,
        profiles.manager,
        { type: "review", id: "app-1", status: "rejected" },
        now,
      ),
    /already been reviewed/,
  );
});
test("capacity is enforced on approval, new applications, and event updates", () => {
  const state = seed();
  const event = state.events[0];
  const full = applyCommand(
    state,
    profiles.admin,
    { type: "save-event", event: { ...event, capacity: 1 } },
    now,
  );
  assert.equal(approvedCount(full, event.id), 1);
  assert.equal(canApply(full, full.events[0], now), false);
  assert.throws(
    () =>
      applyCommand(
        full,
        profiles.manager,
        { type: "review", id: "app-1", status: "approved" },
        now,
      ),
    /capacity/,
  );
  assert.throws(
    () =>
      applyCommand(
        full,
        profiles.student,
        { type: "apply", eventId: event.id, motivation: "Hello" },
        now,
      ),
    /no longer/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        { type: "save-event", event: { ...event, capacity: 0 } },
        now,
      ),
    /Capacity/,
  );
});
test("draft, past, cancelled and paused-organization events do not accept applications", () => {
  const state = seed();
  for (const eventId of ["event-sports", "event-past-0"])
    assert.throws(
      () =>
        applyCommand(
          state,
          profiles.student,
          { type: "apply", eventId, motivation: "Hello" },
          now,
        ),
      /no longer/,
    );
  const paused = applyCommand(
    state,
    profiles.admin,
    {
      type: "save-organization",
      organization: { ...state.organizations[0], status: "paused" },
    },
    now,
  );
  assert.equal(canApply(paused, paused.events[0], now), false);
  const cancelled = applyCommand(
    state,
    profiles.admin,
    { type: "save-event", event: { ...state.events[0], status: "cancelled" } },
    now,
  );
  assert.throws(
    () =>
      applyCommand(
        cancelled,
        profiles.manager,
        { type: "review", id: "app-1", status: "approved" },
        now,
      ),
    /published/,
  );
});
test("record validation catches blank content, invalid dates, and attendance overflow", () => {
  const state = seed();
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.student,
        { type: "apply", eventId: "event-web", motivation: "   " },
        now,
      ),
    /required/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        {
          type: "save-event",
          event: { ...state.events[0], date: "2026-02-31" },
        },
        now,
      ),
    /valid date/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        {
          type: "save-event",
          event: { ...state.events[0], status: "completed", attendance: 1000 },
        },
        now,
      ),
    /Attendance/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        { type: "save-event", event: { ...state.events[0], status: "draft" } },
        now,
      ),
    /active applications/,
  );
});
test("CSV escapes text and prevents spreadsheet formulas", () => {
  assert.equal(
    exportCsv([["=SUM(A1)", 'a"b', "line\nbreak", 5]]),
    '"\'=SUM(A1)","a""b","line\nbreak","5"',
  );
});
