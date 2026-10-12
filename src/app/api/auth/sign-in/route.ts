import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath, SupabaseConfigurationError } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authConfigError,
  authJsonError,
  readJsonBody,
  sameOriginError,
  validEmail,
  validPassword,
} from "@/lib/supabase/route-utils";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validEmail(email) || !validPassword(body?.password)) {
    return authJsonError("Enter a valid email address and password.", 400);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });
    if (error || !data.user) {
      const unverified = error?.code === "email_not_confirmed";
      return authJsonError(
        unverified
          ? "Confirm your email address before signing in. You can resend the confirmation email from account registration."
          : "Email or password is incorrect.",
        401,
      );
    }
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      return authJsonError(
        "Confirm your email address before signing in.",
        403,
      );
    }
    return NextResponse.json({
      redirectTo: safeRedirectPath(
        typeof body.next === "string" ? body.next : null,
      ),
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
