import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath, SupabaseConfigurationError } from "@/lib/supabase/config";
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
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!validEmail(email) || !/^\d{4,12}$/.test(token)) {
    return authJsonError("Enter a valid email address and verification code.", 400);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.user?.email_confirmed_at) {
      return authJsonError(
        "That verification code is invalid or expired. Request a new code and try again.",
        400,
      );
    }

    return NextResponse.json({ redirectTo: safeRedirectPath("/dashboard") });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
