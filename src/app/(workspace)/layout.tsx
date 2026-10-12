import type { ReactNode } from "react";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedUser();
  return children;
}
