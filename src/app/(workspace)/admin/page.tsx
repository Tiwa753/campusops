import { requireProfileRole } from "@/lib/supabase/auth";
import AdminPage from "@/features/admin/page";

export default async function Page() {
  await requireProfileRole("admin");
  return <AdminPage />;
}
