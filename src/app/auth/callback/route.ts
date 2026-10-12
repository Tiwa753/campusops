import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseConfig,
  safeRedirectPath,
  SupabaseConfigurationError,
} from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { siteUrl } = getSupabaseConfig();
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(
        new URL("/sign-in?error=auth-callback", siteUrl),
      );
    }
    const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Supabase auth callback code exchange failed.");
      return NextResponse.redirect(new URL("/sign-in?error=auth-callback", siteUrl));
    }
    return NextResponse.redirect(new URL(next, siteUrl));
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 },
      );
    }
    throw error;
  }
}
