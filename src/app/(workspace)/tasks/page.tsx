import { requireOrganizationManager } from "@/lib/auth";
import TasksPage from "@/features/tasks/page";

export default async function Page() {
  await requireOrganizationManager();
  return <TasksPage />;
}
