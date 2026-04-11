import { InspectionsMetricsDashboard } from "@/components/dashboard/inspections-metrics-dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { getDashboardMetrics } from "@/lib/queries/dashboard-metrics";

export default async function DashboardHomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description="Overview of your inspections and downloads."
      />

      {metrics ? <InspectionsMetricsDashboard metrics={metrics} /> : null}
    </div>
  );
}
