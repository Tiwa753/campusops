import { requireOrganizationManager } from "@/lib/auth";
import AnalyticsPage from "@/features/analytics/page";

export default async function Page() {
  await requireOrganizationManager();
  return <AnalyticsPage />;
}
