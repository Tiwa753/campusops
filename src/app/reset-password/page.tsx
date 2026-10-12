import type { Metadata } from "next";
import AuthPanel from "@/components/auth-panel";

export const metadata: Metadata = { title: "Reset your password · CampusOps" };

export default function ResetPasswordPage() {
  return <AuthPanel mode="reset" />;
}
