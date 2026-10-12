import { createSeed } from "./preview/seed";
import {
  applyCommand,
  eventStartTime,
  type Command,
  type Workspace,
} from "./domain";
import {
  availableContexts,
  createPreviewAccount,
  prepareSignup,
  resolveProfile,
  type Account,
  type SignupInput,
  type WorkspaceContext,
} from "./access";
import type { WorkspaceAdapter, WorkspaceSnapshot } from "./workspace-adapter";

const KEY = "campusops-preview-v2";
const CONTEXT_KEY = "campusops-workspace-context";
type Snapshot = WorkspaceSnapshot;
let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function records(
  value: unknown,
  strings: string[],
  numbers: string[] = [],
): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        strings.every((key) => typeof item[key] === "string") &&
        numbers.every(
          (key) => typeof item[key] === "number" && Number.isFinite(item[key]),
        ),
    )
  );
}
function readStored(raw: string | null): Snapshot {
  if (!raw) return freshSnapshot();
  const stored: unknown = JSON.parse(raw);
  if (
    !isRecord(stored) ||
    !isRecord(stored.data) ||
    !isRecord(stored.account) ||
    !isRecord(stored.account.identity) ||
    !["id", "name", "email"].every(
      (key) =>
        typeof (stored.account as Record<string, Record<string, unknown>>)
          .identity[key] === "string",
    ) ||
    !records(stored.account.universityMemberships, [
      "universityId",
      "role",
      "status",
    ]) ||
    !records(stored.account.organizationMemberships, [
      "universityId",
      "organizationId",
      "role",
      "status",
    ])
  )
    throw new Error("Invalid demo data");
  const data = stored.data;
  if (
    data.version !== 2 ||
    !records(
      data.organizations,
      [
        "id",
        "universityId",
        "name",
        "initials",
        "category",
        "description",
        "lead",
        "status",
        "color",
      ],
      ["members"],
    ) ||
    !records(
      data.events,
      [
        "id",
        "universityId",
        "title",
        "organizationId",
        "kind",
        "description",
        "date",
        "time",
        "location",
        "status",
      ],
      ["capacity", "attendance"],
    ) ||
    !(data.events as Record<string, unknown>[]).every(
      (event) =>
        ["conference", "event", "program", "hackathon", "other"].includes(
          String(event.kind),
        ) &&
        (event.customKind === undefined ||
          typeof event.customKind === "string") &&
        (event.kind !== "other" ||
          (typeof event.customKind === "string" &&
            event.customKind.trim().length > 0 &&
            event.customKind.length <= 40)),
    ) ||
    !records(data.tasks, [
      "id",
      "universityId",
      "title",
      "organizationId",
      "assignee",
      "due",
      "priority",
      "status",
    ]) ||
    !records(data.applications, [
      "id",
      "universityId",
      "eventId",
      "studentId",
      "studentName",
      "email",
      "motivation",
      "status",
      "createdAt",
    ]) ||
    !records(data.activity, [
      "id",
      "universityId",
      "actorId",
      "actorName",
      "text",
      "createdAt",
    ])
  )
    throw new Error("Invalid demo data");
  data.events = (data.events as Record<string, unknown>[]).map((event) => ({
    ...event,
    timeZone:
      typeof event.timeZone === "string" ? event.timeZone : "Africa/Lagos",
  }));
  for (const event of (data as Workspace).events) {
    if (!Number.isFinite(eventStartTime(event)))
      throw new Error("Invalid event date");
  }
  const account = stored.account as Account;
  const context = (stored.context ??
    availableContexts(account)[0]) as WorkspaceContext;
  resolveProfile(account, context);
  return {
    mode: "preview",
    data: data as Workspace,
    account,
    context,
    onboarding: null,
    warning: "",
  };
}
function freshSnapshot(): Snapshot {
  const account = createPreviewAccount();
  return {
    mode: "preview",
    data: createSeed(),
    account,
    context: availableContexts(account)[0],
    onboarding: null,
    warning: "",
  };
}
function emit() {
  listeners.forEach((listener) => listener());
}
function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    snapshot = readStored(raw);
    if (!raw) {
      // Preserve previous demo records without carrying over the self-assigned role.
      const legacyRaw = window.localStorage.getItem("campusops-demo-v1");
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw).data;
          const migrated = { ...legacy, version: 2 };
          for (const key of [
            "organizations",
            "events",
            "tasks",
            "applications",
            "activity",
          ])
            migrated[key] = legacy[key].map(
              (item: Record<string, unknown>) => ({
                ...item,
                universityId: "oau",
              }),
            );
          snapshot = readStored(
            JSON.stringify({ ...snapshot, data: migrated }),
          );
        } catch {
          /* A malformed legacy demo never replaces the fresh workspace. */
        }
      }
      window.localStorage.setItem(
        KEY,
        JSON.stringify({
          mode: snapshot.mode,
          data: snapshot.data,
          account: snapshot.account,
        }),
      );
    }
    try {
      const savedContext = window.sessionStorage.getItem(CONTEXT_KEY);
      if (savedContext) {
        const context = JSON.parse(savedContext) as WorkspaceContext;
        resolveProfile(snapshot.account, context);
        snapshot = { ...snapshot, context };
      }
    } catch {
      /* Invalid or revoked context falls back to a permitted space. */
    }
  } catch {
    snapshot = {
      ...freshSnapshot(),
      warning:
        "Saved demo data could not be read. A fresh demo is ready; changes will be saved when browser storage is available.",
    };
  }
}
function onStorage(event: StorageEvent) {
  if (event.key === KEY || event.key === null) {
    load();
    emit();
  }
}
export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  if (!snapshot) {
    load();
    emit();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
export function getSnapshot() {
  return snapshot;
}
export function getServerSnapshot() {
  return null;
}
function commit(next: Snapshot) {
  snapshot = next;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        mode: next.mode,
        data: next.data,
        account: next.account,
      }),
    );
    window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(next.context));
    snapshot = { ...next, warning: "" };
  } catch {
    snapshot = {
      ...next,
      warning:
        "Browser storage is unavailable. You can keep using the demo, but changes may be lost on refresh.",
    };
  }
  emit();
}
async function execute(
  command: Command,
  account = snapshot?.account,
  context = snapshot?.context,
) {
  if (!snapshot) throw new Error("Workspace is loading.");
  if (!account || !context) throw new Error("Workspace access is unavailable.");
  commit({
    ...snapshot,
    data: applyCommand(
      snapshot.data,
      resolveProfile(account, context),
      command,
    ),
  });
}
async function selectContext(
  context: WorkspaceContext,
  account = snapshot?.account,
) {
  if (!snapshot) throw new Error("Workspace is loading.");
  if (!account) throw new Error("Workspace access is unavailable.");
  resolveProfile(account, context);
  commit({ ...snapshot, context });
}
async function prepareOnboarding(input: SignupInput) {
  if (!snapshot) throw new Error("Workspace is loading.");
  const organizationIds = snapshot.data.organizations
    .filter(
      (org) =>
        org.universityId === input.universityId && org.status === "active",
    )
    .map((org) => org.id);
  const onboarding = prepareSignup(input, organizationIds);
  // Preview submissions are ephemeral: no account is created and no email is sent.
  snapshot = { ...snapshot, onboarding };
  emit();
  return onboarding;
}
async function resetPreview() {
  commit(freshSnapshot());
}

export const previewAdapter: WorkspaceAdapter = {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  execute,
  selectContext,
  prepareOnboarding,
  resetPreview,
};
