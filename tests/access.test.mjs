import { test } from "node:test";
import assert from "node:assert/strict";
import {
  availableContexts,
  createPreviewAccount,
  prepareSignup,
  resolveProfile,
} from "../src/lib/access.ts";
import { applyCommand, selectWorkspace } from "../src/lib/domain.ts";
import { createSeed, profiles } from "../src/lib/preview/seed.ts";
import { campusDate, campusInstant } from "../src/lib/calendar.ts";

const now = new Date("2026-10-12T10:00:00Z");
const personal = { universityId: "oau", kind: "personal" };
const management = {
  universityId: "oau",
  kind: "organization",
  organizationId: "org-tech",
};

test("university dates and event start times do not depend on a visitor's timezone", () => {
  assert.equal(campusDate(new Date("2026-10-12T23:30:00Z")), "2026-10-13");
  assert.equal(
    new Date(
      campusInstant("2026-10-12", "09:00", "Africa/Lagos"),
    ).toISOString(),
    "2026-10-12T08:00:00.000Z",
  );
  assert.equal(
    new Date(
      campusInstant("2026-10-12", "09:00", "America/New_York"),
    ).toISOString(),
    "2026-10-12T13:00:00.000Z",
  );
  assert.throws(
    () => campusInstant("2026-03-08", "02:30", "America/New_York"),
    /does not exist/,
  );
});

test("a leader retains a student identity across personal and organization spaces", () => {
  const account = createPreviewAccount();
  const student = resolveProfile(account, personal);
  const manager = resolveProfile(account, management);
  assert.equal(student.id, manager.id);
  assert.equal(student.role, "student");
  assert.equal(manager.role, "manager");
  assert.equal(availableContexts(account).length, 2);
  const applied = applyCommand(
    createSeed(now),
    student,
    {
      type: "apply",
      eventId: "event-impact",
      motivation: "I would like to volunteer.",
    },
    now,
  );
  assert.equal(applied.applications[0].studentId, manager.id);
  assert.equal(selectWorkspace(applied, student).applications.length, 1);
  assert.ok(
    !selectWorkspace(applied, manager).applications.some(
      (app) => app.id === applied.applications[0].id,
    ),
  );
});
test("context navigation cannot create administrator or unrelated organization access", () => {
  const account = createPreviewAccount();
  assert.throws(
    () =>
      resolveProfile(account, { universityId: "oau", kind: "administration" }),
    /access/,
  );
  assert.throws(
    () =>
      resolveProfile(account, { ...management, organizationId: "org-arts" }),
    /access/,
  );
  assert.throws(
    () =>
      resolveProfile(account, {
        ...personal,
        universityId: "another-university",
      }),
    /university membership/,
  );
});
test("pending and revoked leadership memberships never grant management access", () => {
  for (const status of ["pending", "revoked"]) {
    const account = createPreviewAccount();
    account.organizationMemberships[0].status = status;
    assert.equal(availableContexts(account).length, 1);
    assert.throws(() => resolveProfile(account, management), /access/);
  }
});
test("suspending university membership removes every workspace in that university", () => {
  const account = createPreviewAccount();
  account.universityMemberships[0].status = "suspended";
  assert.equal(availableContexts(account).length, 0);
  assert.throws(
    () => resolveProfile(account, personal),
    /university membership/,
  );
  assert.throws(
    () => resolveProfile(account, management),
    /university membership/,
  );
});
test("one person can manage several organizations without merging their records", () => {
  const account = createPreviewAccount();
  account.organizationMemberships.push({
    ...account.organizationMemberships[0],
    organizationId: "org-arts",
  });
  const state = createSeed(now);
  assert.equal(availableContexts(account).length, 3);
  for (const organizationId of ["org-tech", "org-arts"]) {
    const profile = resolveProfile(account, { ...management, organizationId });
    assert.ok(
      selectWorkspace(state, profile).events.every(
        (event) => event.organizationId === organizationId,
      ),
    );
  }
});
test("signup intent never grants leadership or administration", () => {
  const result = prepareSignup(
    {
      name: "Ada Okafor",
      email: "ADA@example.test",
      universityId: "oau",
      intent: "lead",
      organizationId: "org-tech",
      role: "admin",
    },
    ["org-tech"],
    now,
  );
  assert.equal(result.account.identity.email, "ada@example.test");
  assert.deepEqual(result.account.universityMemberships, [
    { universityId: "oau", role: "student", status: "pending" },
  ]);
  assert.equal(result.account.organizationMemberships.length, 0);
  assert.equal(result.leadershipRequest.status, "pending");
  assert.equal(availableContexts(result.account).length, 0);
  assert.throws(() => resolveProfile(result.account, personal), /membership/);
  assert.throws(() => resolveProfile(result.account, management), /membership/);
});
test("signup rejects unknown universities, organization IDs, and malformed input", () => {
  const valid = {
    name: "Ada Okafor",
    email: "ada@example.test",
    universityId: "oau",
    intent: "lead",
    organizationId: "org-tech",
  };
  assert.throws(
    () => prepareSignup({ ...valid, universityId: "fake" }, ["org-tech"]),
    /university/,
  );
  assert.throws(
    () =>
      prepareSignup({ ...valid, organizationId: "foreign-org" }, ["org-tech"]),
    /organization/,
  );
  assert.throws(
    () => prepareSignup({ ...valid, intent: "admin" }, ["org-tech"]),
    /involved/,
  );
  assert.throws(
    () => prepareSignup({ ...valid, email: "bad" }, ["org-tech"]),
    /email/,
  );
  assert.throws(
    () => prepareSignup({ ...valid, name: " " }, ["org-tech"]),
    /name/,
  );
});
test("even a university administrator cannot read or mutate another university", () => {
  const state = createSeed(now);
  const foreignOrg = {
    ...state.organizations[0],
    id: "foreign-org",
    universityId: "another-university",
  };
  const foreignEvent = {
    ...state.events[0],
    id: "foreign-event",
    organizationId: foreignOrg.id,
    universityId: foreignOrg.universityId,
  };
  state.organizations.push(foreignOrg);
  state.events.push(foreignEvent);
  const scoped = selectWorkspace(state, profiles.admin);
  assert.ok(!scoped.organizations.some((org) => org.id === foreignOrg.id));
  assert.ok(!scoped.events.some((event) => event.id === foreignEvent.id));
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        { type: "save-event", event: foreignEvent },
        now,
      ),
    /outside your university/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.admin,
        {
          type: "save-organization",
          organization: { ...foreignOrg, universityId: "oau" },
        },
        now,
      ),
    /outside your university/,
  );
  assert.throws(
    () =>
      applyCommand(
        state,
        profiles.student,
        { type: "apply", eventId: foreignEvent.id, motivation: "Hello" },
        now,
      ),
    /outside your university/,
  );
});
test("leaders cannot approve or reject their own applications", () => {
  const account = createPreviewAccount();
  const student = resolveProfile(account, personal);
  const manager = resolveProfile(account, management);
  const state = applyCommand(
    createSeed(now),
    student,
    {
      type: "apply",
      eventId: "event-hack",
      motivation: "I would like to participate too.",
    },
    now,
  );
  for (const status of ["approved", "rejected"])
    assert.throws(
      () =>
        applyCommand(
          state,
          manager,
          { type: "review", id: state.applications[0].id, status },
          now,
        ),
      /own application/,
    );
  const reviewed = applyCommand(
    state,
    profiles.admin,
    { type: "review", id: state.applications[0].id, status: "approved" },
    now,
  );
  assert.equal(reviewed.applications[0].status, "approved");
  assert.equal(reviewed.activity[0].performedBy, profiles.admin.id);
  assert.equal(reviewed.activity[0].actorId, student.id);
});
