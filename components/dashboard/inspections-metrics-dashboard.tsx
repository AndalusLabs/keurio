import { KpiCard } from "@/components/dashboard/kpi-card";
import { InspectionsActivityChart } from "@/components/dashboard/inspections-activity-chart";
import type { DashboardMetrics } from "@/lib/queries/dashboard-metrics";

type Props = {
  metrics: DashboardMetrics;
};

function capitalizeMonthLabel(label: string) {
  return label.replace(/^./u, (c) => c.toUpperCase());
}

function trendFromDelta(delta: string | null): "up" | "down" | "flat" {
  if (!delta || delta === "new" || delta === "0%") return "flat";
  if (delta.startsWith("−") || delta.startsWith("-")) return "down";
  return "up";
}

/**
 * KPI strip + activity chart. The four KPIs are the ones the ops team uses
 * daily: new this month, open, in progress, completed.
 */
export function InspectionsMetricsDashboard({ metrics }: Props) {
  const monthTitle = capitalizeMonthLabel(metrics.calendarMonthLabel);
  const chartSpark = metrics.chartData.slice(-7).map((d) => d.count);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="New inspections"
          value={metrics.monthTotal.toLocaleString("nl-NL")}
          delta={metrics.monthTotalDelta ?? undefined}
          trend={trendFromDelta(metrics.monthTotalDelta)}
          tone="brand"
          spark={chartSpark}
          subtitle={monthTitle}
          highlight
        />
        <KpiCard
          label="Open"
          value={metrics.openCount.toLocaleString("nl-NL")}
          trend="flat"
          subtitle="awaiting action"
          spark={[12, 18, 14, 22, 20, 26, metrics.openCount]}
        />
        <KpiCard
          label="In progress"
          value={metrics.inProgressCount.toLocaleString("nl-NL")}
          trend="flat"
          tone="amber"
          subtitle="currently being worked on"
          spark={[6, 9, 8, 12, 11, 14, metrics.inProgressCount]}
        />
        <KpiCard
          label="Completed"
          value={metrics.completedCount.toLocaleString("nl-NL")}
          trend="up"
          subtitle="All time"
          spark={chartSpark}
        />
      </div>

      <InspectionsActivityChart
        data={metrics.chartData}
        monthLabel={monthTitle}
        summary={{
          total: metrics.chartSummary.total.toLocaleString("nl-NL"),
          totalDelta:
            metrics.chartSummary.previousTotal > 0
              ? `vs ${metrics.chartSummary.previousTotal.toLocaleString("nl-NL")} prev.`
              : undefined,
          avgPerDay: metrics.chartSummary.avgPerDay.toString(),
          bestDay: metrics.chartSummary.bestDay
            ? `${metrics.chartSummary.bestDay.label} · ${metrics.chartSummary.bestDay.count}`
            : "—",
          avgCompletion: "22m 14s",
        }}
      />
    </div>
  );
}
