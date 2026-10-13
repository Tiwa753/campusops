import { NextRequest, NextResponse } from "next/server";
import { universities } from "@/lib/access";
import { getSupabaseConfig, safeRedirectPath, SupabaseConfigurationError } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authConfigError,
  authJsonError,
  readJsonBody,
  sameOriginError,
  validEmail,
  validPassword,
} from "@/lib/supabase/route-utils";
import { validSignupIntent } from "@/lib/supabase/signup-intent";

export async function POST(request: NextRequest) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  const fullName =
    typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const universityId =
    typeof body?.universityId === "string" ? body.universityId : "";
  const signupIntent =
    typeof body?.signupIntent === "string" ? body.signupIntent : "";
  const password = body?.password;

  if (fullName.length < 2 || fullName.length > 80) {
    return authJsonError("Enter a name between 2 and 80 characters.", 400);
  }
  if (!validEmail(email)) return authJsonError("Enter a valid email address.", 400);
  if (!validPassword(password)) {
    return authJsonError("Use a password between 8 and 72 characters.", 400);
  }
  if (!universities.some((university) => university.id === universityId)) {
    return authJsonError("Select a supported university.", 400);
  }
  if (!validSignupIntent(signupIntent)) {
    return authJsonError("Choose a valid account type.", 400);
  }

  try {
    const { siteUrl } = getSupabaseConfig();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) {
      return authJsonError("Sign out before creating another account.", 409);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          university_id: universityId,
          signup_intent: signupIntent,
        },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      console.error("Supabase account registration failed.");
      return authJsonError(
        "Unable to create the account. Check your details and try again.",
        400,
      );
    }
    return NextResponse.json({
      confirmationRequired: !data.session,
      redirectTo: safeRedirectPath("/dashboard"),
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return authConfigError(error);
    throw error;
  }
}
