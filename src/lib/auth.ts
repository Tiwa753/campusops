import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Account } from "@/lib/access";

type AuthenticatedUser = {
  id: string;
  email: string;
  email_confirmed_at: string;
  user_metadata: { full_name: string };
};

async function getAuthenticatedAccount(): Promise<Account | null> {
  const cookieHeader = (await cookies())
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  if (!cookieHeader) return null;

  const backendUrl = process.env.CAMPUSOPS_API_URL ?? "http://127.0.0.1:8000";
  let response: Response;
  try {
    response = await fetch(new URL("/auth/account", backendUrl), {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Python authentication backend request failed.", error);
    throw new Error(
      "The Python authentication service is unavailable. Start the FastAPI backend and try again.",
    );
  }

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("Unable to verify your CampusOps account.");
  }
  const result = (await response.json()) as { account?: Account };
  return result.account ?? null;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const account = await getAuthenticatedAccount();
  if (!account) redirect("/sign-in");
  return {
    id: account.identity.id,
    email: account.identity.email,
    email_confirmed_at: "verified",
    user_metadata: { full_name: account.identity.name },
  };
}

export async function requireProfileRole(
  allowedRole: "admin" | "student",
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  const account = await getAuthenticatedAccount();
  if (!account) redirect("/sign-in");
  const expectedRole = allowedRole === "admin" ? "administrator" : "student";
  if (
    !account.universityMemberships.some(
      (membership) =>
        membership.role === expectedRole && membership.status === "active",
    )
  ) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireOrganizationManager(): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();
  const account = await getAuthenticatedAccount();
  if (!account) redirect("/sign-in");
  const isAdministrator = account.universityMemberships.some(
    (membership) =>
      membership.role === "administrator" && membership.status === "active",
  );
  const isManager = account.organizationMemberships.some(
    (membership) =>
      membership.role === "manager" && membership.status === "active",
  );
  if (!isAdministrator && !isManager) redirect("/dashboard");
  return user;
}
