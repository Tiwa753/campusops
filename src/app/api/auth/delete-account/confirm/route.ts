import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  AccountDeletionConfigurationError,
  createAccountDeletionAdminClient,
} from "@/lib/supabase/account-deletion-admin";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import {
  authJsonError,
  readJsonBody,
  sameOriginError,
} from "@/lib/supabase/route-utils";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  const token = body?.token;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return authJsonError("This deletion link is invalid or expired.", 400);
  }

  try {
    const admin = createAccountDeletionAdminClient();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: deletionRequest, error: lookupError } = await admin
      .from("account_deletion_requests")
      .select("user_id")
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (lookupError) {
      console.error("Unable to verify an account-deletion link.");
      return authJsonError("Unable to verify this deletion link.", 503);
    }
    if (!deletionRequest) {
      return authJsonError("This deletion link is invalid or expired.", 410);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(
      deletionRequest.user_id,
    );
    if (deleteError) {
      console.error("Supabase could not delete the confirmed user account.");
      return authJsonError(
        "Unable to delete this account. Please contact support.",
        502,
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof SupabaseConfigurationError ||
      error instanceof AccountDeletionConfigurationError
    ) {
      return authJsonError(error.message, 503);
    }
    console.error("Account deletion confirmation failed.");
    return authJsonError("Unable to delete this account. Please try again.", 502);
  }
}
