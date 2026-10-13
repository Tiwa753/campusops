import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

const publicPaths = new Set([
  "/",
  "/sign-up",
  "/sign-in",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/account-deletion",
  "/account-deleted",
]);

export async function updateSupabaseSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    publicPaths.has(pathname) || pathname.startsWith("/api/auth/");
  if (!isSupabaseConfigured()) {
    if (isPublic) {
      return NextResponse.next({ request });
    }
    return NextResponse.json(
      {
        error:
          "Authentication is not configured. Set the Supabase URL, publishable key, and site URL.",
      },
      { status: 503 },
    );
  }

  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Supabase session verification failed.");
    if (isPublic) {
      return response;
    }
    const login = new URL("/sign-in?error=auth-unavailable", getSupabaseConfig().siteUrl);
    const redirectResponse = NextResponse.redirect(login);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  if (!user && !isPublic) {
    const login = new URL("/sign-in", getSupabaseConfig().siteUrl);
    login.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return redirectWithCookies(login, response);
  }

  if (user && !user.email_confirmed_at && !isPublic) {
    return redirectWithCookies(
      new URL("/sign-in?error=email-unverified", getSupabaseConfig().siteUrl),
      response,
    );
  }
  return response;
}

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return redirectResponse;
}
