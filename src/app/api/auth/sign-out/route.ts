import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authConfigError,
  authJsonError,
  sameOriginError,
} from "@/lib/supabase/route-utils";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase sign-out failed.");
      return authJsonError("Unable to end this session. Please try again.", 502);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
