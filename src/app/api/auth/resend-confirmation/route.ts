import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, SupabaseConfigurationError } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authConfigError,
  authJsonError,
  readJsonBody,
  sameOriginError,
  validEmail,
} from "@/lib/supabase/route-utils";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validEmail(email)) return authJsonError("Enter a valid email address.", 400);

  try {
    const { siteUrl } = getSupabaseConfig();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
    });
    if (error) console.error("Supabase confirmation email request failed.");
    return NextResponse.json({
      message:
        "If the account needs confirmation, a new email will arrive shortly.",
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
