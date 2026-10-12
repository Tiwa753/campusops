import type { Profile } from "./domain";

export type University = {
  id: string;
  name: string;
  shortName: string;
  location: string;
  countryCode: string;
  locale: string;
  timeZone: string;
};
export const universities: readonly University[] = [{
  id: "oau", name: "Obafemi Awolowo University", shortName: "OAU",
  location: "Ile-Ife, Nigeria", countryCode: "NG", locale: "en-NG", timeZone: "Africa/Lagos",
}];

export type Identity = { id: string; name: string; email: string };
export type UniversityMembership = {
  universityId: string;
  role: "student" | "administrator";
  status: "pending" | "active" | "suspended";
};
export type OrganizationMembership = {
  universityId: string;
  organizationId: string;
  role: "member" | "manager";
  status: "pending" | "active" | "revoked";
};
export type Account = {
  identity: Identity;
  universityMemberships: UniversityMembership[];
  organizationMemberships: OrganizationMembership[];
};
// A workspace selects a context. It never grants a membership or changes identity.
export type WorkspaceContext =
  | { universityId: string; kind: "personal" }
  | { universityId: string; kind: "organization"; organizationId: string }
  | { universityId: string; kind: "administration" };
export type LeadershipRequest = {
  id: string; userId: string; universityId: string; organizationId: string;
  status: "pending"; createdAt: string;
};
export type SignupInput = {
  name: string; email: string; universityId: string;
  intent: "participate" | "lead"; organizationId?: string;
};

export function resolveProfile(account: Account, context: WorkspaceContext): Profile {
  const membership = account.universityMemberships.find(item => item.universityId === context.universityId && item.status === "active");
  if (!membership) throw new Error("An active university membership is required.");
  const base = { ...account.identity, universityId: context.universityId };
  if (context.kind === "personal" && membership.role === "student") return { ...base, role: "student" };
  if (context.kind === "administration" && membership.role === "administrator") return { ...base, role: "admin" };
  if (context.kind === "organization" && account.organizationMemberships.some(item => item.universityId === context.universityId && item.organizationId === context.organizationId && item.role === "manager" && item.status === "active")) {
    return { ...base, role: "manager", organizationId: context.organizationId };
  }
  throw new Error("You do not have access to this workspace.");
}

export function availableContexts(account: Account): WorkspaceContext[] {
  return account.universityMemberships.filter(item => item.status === "active").flatMap(membership => {
    const universityId = membership.universityId;
    const contexts: WorkspaceContext[] = [{ universityId, kind: membership.role === "student" ? "personal" : "administration" }];
    for (const item of account.organizationMemberships) {
      if (item.universityId === universityId && item.role === "manager" && item.status === "active") contexts.push({ universityId, kind: "organization", organizationId: item.organizationId });
    }
    return contexts;
  });
}

export function accountLabel(account: Account, universityId: string) {
  const membership = account.universityMemberships.find(item => item.universityId === universityId && item.status === "active");
  if (membership?.role === "administrator") return "University administrator";
  const leads = account.organizationMemberships.some(item => item.universityId === universityId && item.status === "active" && item.role === "manager");
  return membership ? (leads ? "Student · Organization leader" : "Student") : "Verification pending";
}

export function prepareSignup(input: SignupInput, organizationIds: readonly string[], now = new Date()) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2 || name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!universities.some(university => university.id === input.universityId)) throw new Error("Select a supported university.");
  if (input.intent !== "participate" && input.intent !== "lead") throw new Error("Select how you want to get involved.");
  if (input.intent === "lead" && (!input.organizationId || !organizationIds.includes(input.organizationId))) throw new Error("Select an organization at your university.");
  const identity: Identity = { id: crypto.randomUUID(), name, email };
  const account: Account = {
    identity,
    // Only a trusted verification workflow may activate this membership.
    universityMemberships: [{ universityId: input.universityId, role: "student", status: "pending" }],
    organizationMemberships: [],
  };
  const leadershipRequest: LeadershipRequest | undefined = input.intent === "lead" ? {
    id: crypto.randomUUID(), userId: identity.id, universityId: input.universityId,
    organizationId: input.organizationId!, status: "pending", createdAt: now.toISOString(),
  } : undefined;
  return { account, leadershipRequest };
}

export function createPreviewAccount(): Account {
  return {
    identity: { id: "user-manager", name: "Damilola Adeyemi", email: "damilola@example.test" },
    universityMemberships: [{ universityId: "oau", role: "student", status: "active" }],
    organizationMemberships: [{ universityId: "oau", organizationId: "org-tech", role: "manager", status: "active" }],
  };
}
