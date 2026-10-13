import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  AccountDeletionConfigurationError,
  createAccountDeletionAdminClient,
  sendAccountDeletionEmail,
} from "@/lib/supabase/account-deletion-admin";
import {
  getSupabaseConfig,
  SupabaseConfigurationError,
} from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authJsonError, sameOriginError } from "@/lib/supabase/route-utils";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  try {
    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await sessionClient.auth.getUser();
    if (error || !user?.email_confirmed_at || !user.email) {
      return authJsonError("Sign in with a confirmed email to continue.", 401);
    }

    const admin = createAccountDeletionAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile) {
      console.error("Unable to load the profile for account deletion.");
      return authJsonError("Unable to prepare account deletion.", 503);
    }

    const { data: recentRequest, error: rateLimitLookupError } = await admin
      .from("account_deletion_requests")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (rateLimitLookupError) {
      console.error("Unable to check account-deletion request timing.");
      return authJsonError("Unable to prepare account deletion.", 503);
    }
    if (
      recentRequest &&
      Date.now() - Date.parse(recentRequest.created_at) < 60_000
    ) {
      return authJsonError(
        "Please wait a minute before requesting another confirmation email.",
        429,
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { error: insertError } = await admin
      .from("account_deletion_requests")
      .upsert(
        {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (insertError) {
      console.error("Unable to store an account-deletion request.");
      return authJsonError("Unable to prepare account deletion.", 503);
    }

    const { siteUrl } = getSupabaseConfig();
    const confirmationUrl = new URL("/account-deletion", siteUrl);
    confirmationUrl.searchParams.set("token", token);
    try {
      await sendAccountDeletionEmail({
        confirmationUrl: confirmationUrl.toString(),
        email: user.email,
        fullName: profile.full_name,
      });
    } catch (emailError) {
      const { error: cleanupError } = await admin
        .from("account_deletion_requests")
        .delete()
        .eq("token_hash", tokenHash);
      if (cleanupError) {
        console.error("Unable to remove a deletion token after email failure.");
      }
      if (emailError instanceof AccountDeletionConfigurationError) {
        return authJsonError(emailError.message, 503);
      }
      throw emailError;
    }

    return NextResponse.json({
      message: "Check your email for a link to confirm account deletion.",
    });
  } catch (error) {
    if (
      error instanceof SupabaseConfigurationError ||
      error instanceof AccountDeletionConfigurationError
    ) {
      return authJsonError(error.message, 503);
    }
    console.error("Account-deletion email request failed.");
    return authJsonError("Unable to send the confirmation email. Try again.", 502);
  }
}
