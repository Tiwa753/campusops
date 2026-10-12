import type { Metadata } from "next";
import AuthPanel from "@/components/auth-panel";

export const metadata: Metadata = { title: "Sign in · CampusOps" };

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthPanel
      mode="signin"
      errorCode={params.error}
      verificationNotice={params.notice === "verify-email"}
    />
  );
}
