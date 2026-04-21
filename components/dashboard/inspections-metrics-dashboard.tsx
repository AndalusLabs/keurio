import {
  CheckCircle2,
  ClipboardList,
  FileDown,
  Timer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/queries/dashboard-metrics";
import { InspectionsActivityChart } from "@/components/dashboard/inspections-activity-chart";

type Props = {
  metrics: DashboardMetrics;
};

function capitalizeMonthLabel(label: string) {
  return label.replace(/^./u, (c) => c.toUpperCase());
}

export function InspectionsMetricsDashboard({ metrics }: Props) {
  const monthTitle = capitalizeMonthLabel(metrics.calendarMonthLabel);

  const cards = [
    {
      title: monthTitle,
      description: "New inspections",
      value: metrics.monthTotal,
      icon: ClipboardList,
    },
    {
      title: "Open",
      description: "In progress",
      value: metrics.openCount,
      icon: Timer,
    },
    {
      title: "Completed",
      description: "Finished inspections",
      value: metrics.completedCount,
      icon: CheckCircle2,
    },
    {
      title: "PDF reports",
      description: "Report downloads",
      value: metrics.pdfDownloads,
      icon: FileDown,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, description, value, icon: Icon }) => (
          <Card
            key={title}
            className="border-border/80 shadow-sm transition-colors hover:border-primary/20"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex min-h-[3.25rem] flex-col justify-start space-y-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <CardDescription className="text-xs leading-tight">
                  {description}
                </CardDescription>
              </div>
              <div className="rounded-lg bg-accent/60 p-2 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {value.toLocaleString("nl-NL")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <InspectionsActivityChart
        data={metrics.chartData}
        monthLabel={metrics.calendarMonthLabel}
      />
    </div>
  );
}
