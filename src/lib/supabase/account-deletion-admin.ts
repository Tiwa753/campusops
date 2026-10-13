import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export class AccountDeletionConfigurationError extends Error {
  constructor() {
    super(
      "Account deletion email is not configured. Set the server-side Supabase service role key, Resend API key, and verified sender address.",
    );
    this.name = "AccountDeletionConfigurationError";
  }
}

export function createAccountDeletionAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    !serviceRoleKey ||
    serviceRoleKey.startsWith("sb_publishable_") ||
    (!serviceRoleKey.startsWith("sb_secret_") &&
      !isLegacyServiceRoleKey(serviceRoleKey))
  ) {
    throw new AccountDeletionConfigurationError();
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isLegacyServiceRoleKey(value: string) {
  const payload = value.split(".")[1];
  if (!payload) return false;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return (
      !!parsed &&
      typeof parsed === "object" &&
      "role" in parsed &&
      parsed.role === "service_role"
    );
  } catch {
    return false;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendAccountDeletionEmail({
  confirmationUrl,
  email,
  fullName,
}: {
  confirmationUrl: string;
  email: string;
  fullName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new AccountDeletionConfigurationError();

  const safeName = escapeHtml(fullName);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirm account deletion · CampusOps",
      text: `Hello ${fullName},\n\nA request was made to permanently delete your CampusOps account. If this was you, confirm the deletion within 30 minutes:\n${confirmationUrl}\n\nIf you did not request this, ignore this email. Your account will remain active.\n\nCampusOps`,
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#17172a;line-height:1.6"><p style="color:#5b5bd6;font-weight:700;letter-spacing:.08em">CAMPUSOPS</p><h1 style="font-size:24px">Confirm account deletion</h1><p>Hello ${safeName},</p><p>A request was made to permanently delete your CampusOps account and its profile and organization memberships.</p><p>This action cannot be undone. To continue, confirm within 30 minutes:</p><p><a href="${confirmationUrl}" style="display:inline-block;background:#5b5bd6;color:white;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:700">Review deletion request</a></p><p>For your protection, opening the link will show a final confirmation step. If you did not request deletion, ignore this email; your account will remain active.</p><p>CampusOps</p></main>`,
    }),
  });

  if (!response.ok) {
    console.error("Resend rejected the account-deletion email.");
    throw new Error("Unable to send the account-deletion email.");
  }
}
