import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authConfigError,
  authJsonError,
  readJsonBody,
  sameOriginError,
  validPassword,
} from "@/lib/supabase/route-utils";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!validPassword(body?.password)) {
    return authJsonError("Use a password between 8 and 72 characters.", 400);
  }
  if (body.password !== body.confirmPassword) {
    return authJsonError("The passwords do not match.", 400);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user?.email_confirmed_at) {
      return authJsonError("This password reset link is invalid or expired.", 401);
    }
    const { error } = await supabase.auth.updateUser({
      password: body.password,
    });
    if (error) {
      console.error("Supabase password reset failed.");
      return authJsonError("Unable to update the password. Request a new reset link.", 400);
    }
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
