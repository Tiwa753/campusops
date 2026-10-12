import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, SupabaseConfigurationError } from "./config";

export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

export function sameOriginError(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return authJsonError("Invalid request origin.", 403);
  try {
    return new URL(origin).origin === getSupabaseConfig().siteUrl
      ? null
      : authJsonError("Invalid request origin.", 403);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return authJsonError(error.message, 503);
    }
    throw error;
  }
}

export function authJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function authConfigError(error: unknown) {
  if (error instanceof SupabaseConfigurationError) {
    return authJsonError(error.message, 503);
  }
  throw error;
}

export function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

export function validPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 72 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}
