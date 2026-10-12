import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

export async function requireAuthenticatedUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }
  if (!user.email_confirmed_at) {
    redirect("/sign-up?notice=verify-email");
  }
  return user;
}

export async function requireProfileRole(
  allowedRole: "admin" | "student",
): Promise<User> {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error("Could not verify account permissions.");
  if (!data || data.role !== allowedRole) redirect("/dashboard");
  return user;
}

export async function requireOrganizationManager(): Promise<User> {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("Could not verify account permissions.");
  if (profile?.role === "admin") return user;

  const { data: memberships, error } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("status", "active")
    .limit(1);

  if (error) throw new Error("Could not verify organization access.");
  if (!memberships?.length) redirect("/dashboard");
  return user;
}
