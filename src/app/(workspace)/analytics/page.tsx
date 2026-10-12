import { requireOrganizationManager } from "@/lib/supabase/auth";
import AnalyticsPage from "@/features/analytics/page";

export default async function Page() {
  await requireOrganizationManager();
  return <AnalyticsPage />;
}
