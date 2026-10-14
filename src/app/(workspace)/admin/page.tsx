import { requireProfileRole } from "@/lib/auth";
import AdminPage from "@/features/admin/page";

export default async function Page() {
  await requireProfileRole("admin");
  return <AdminPage />;
}
