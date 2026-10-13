import { NextResponse } from "next/server";
import { availableContexts, type Account } from "@/lib/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.email_confirmed_at) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, university_id, role, signup_intent")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Unable to load the authenticated profile.");
    return NextResponse.json(
      { error: "Unable to load your account permissions." },
      { status: 503 },
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: "Your account profile has not been provisioned." },
      { status: 403 },
    );
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("university_id, organization_id, role, status")
    .eq("user_id", user.id);
  if (membershipError) {
    console.error("Unable to load organization memberships.");
    return NextResponse.json(
      { error: "Unable to load your account permissions." },
      { status: 503 },
    );
  }

  const account: Account = {
    identity: {
      id: user.id,
      name: profile.full_name,
      email: user.email ?? "",
    },
    signupIntent: profile.signup_intent,
    universityMemberships: [
      {
        universityId: profile.university_id,
        role: profile.role === "admin" ? "administrator" : "student",
        status: "active",
      },
    ],
    organizationMemberships: memberships.map((membership) => ({
      universityId: membership.university_id,
      organizationId: membership.organization_id,
      role: membership.role,
      status: membership.status,
    })),
  };
  if (!availableContexts(account).length) {
    return NextResponse.json(
      { error: "Your account has no active workspace membership." },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { account },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
