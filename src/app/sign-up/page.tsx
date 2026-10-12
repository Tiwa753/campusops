import type { Metadata } from "next";
import Signup from "@/components/signup";

export const metadata: Metadata = { title: "Join your campus · CampusOps" };
export default function SignupPage() {
  return <Signup />;
}
