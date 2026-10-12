export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Authentication is not configured. Set the Supabase URL, publishable key, and site URL.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url || !publishableKey || !siteUrl) {
    throw new SupabaseConfigurationError();
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new SupabaseConfigurationError();
  }

  let supabaseUrl: URL;
  let applicationUrl: URL;
  try {
    supabaseUrl = new URL(url);
    applicationUrl = new URL(siteUrl);
  } catch {
    throw new SupabaseConfigurationError();
  }

  const validProtocol = (value: URL) =>
    value.protocol === "https:" ||
    (process.env.NODE_ENV !== "production" &&
      value.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(value.hostname));
  if (
    !validProtocol(supabaseUrl) ||
    !validProtocol(applicationUrl) ||
    applicationUrl.pathname !== "/" ||
    applicationUrl.search ||
    applicationUrl.hash ||
    supabaseUrl.username ||
    supabaseUrl.password ||
    applicationUrl.username ||
    applicationUrl.password
  ) {
    throw new SupabaseConfigurationError();
  }

  return {
    url: supabaseUrl.origin,
    publishableKey,
    siteUrl: applicationUrl.origin,
  };
}

export function isSupabaseConfigured() {
  try {
    getSupabaseConfig();
    return true;
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return false;
    throw error;
  }
}

export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
) {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }
  const { siteUrl } = getSupabaseConfig();
  const target = new URL(candidate, siteUrl);
  if (
    target.origin !== siteUrl ||
    target.pathname.startsWith("/auth/") ||
    target.pathname.startsWith("/api/") ||
    ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"].includes(
      target.pathname,
    )
  ) {
    return fallback;
  }
  return `${target.pathname}${target.search}${target.hash}`;
}
