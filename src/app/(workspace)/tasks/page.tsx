import { requireOrganizationManager } from "@/lib/supabase/auth";
import TasksPage from "@/features/tasks/page";

export default async function Page() {
  await requireOrganizationManager();
  return <TasksPage />;
}
