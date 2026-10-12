import type { Metadata } from "next";
import AuthPanel from "@/components/auth-panel";

export const metadata: Metadata = { title: "Recover your account · CampusOps" };

export default function ForgotPasswordPage() {
  return <AuthPanel mode="forgot" />;
}
