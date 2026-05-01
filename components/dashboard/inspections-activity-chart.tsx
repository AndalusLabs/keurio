"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { InspectionsChartPoint } from "@/lib/queries/dashboard-metrics";

type ExtendedPoint = InspectionsChartPoint & { previous?: number };

const chartConfig = {
  count: {
    label: "This period",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type Props = {
  data: ExtendedPoint[];
  monthLabel: string;
  /**
   * Optional summary — rendered in the chart footer.
   * Omit any key to hide that stat.
   */
  summary?: {
    total?: string;
    totalDelta?: string;
    avgPerDay?: string;
    bestDay?: string;
    avgCompletion?: string;
  };
};

/**
 * Inspection activity chart — paired bars: current period (brand green) vs
 * previous period (pale slate). Summary footer surfaces headline stats so the
 * chart works as a standalone card.
 */
export function InspectionsActivityChart({ data, monthLabel, summary }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle>Inspection activity</CardTitle>
          <CardDescription>
            Completed inspections for {monthLabel}
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Legend color="hsl(var(--primary))" label="This period" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 8, right: 8, top: 6, bottom: 0 }}
            barGap={2}
            barCategoryGap={10}
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeDasharray="0"
              strokeOpacity={0.7}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as ExtendedPoint | undefined;
                    return row?.date ?? "";
                  }}
                />
              }
              cursor={{ fill: "hsl(var(--accent) / 0.25)" }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
              activeBar={{
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--accent))",
                strokeWidth: 1,
              }}
            />
          </BarChart>
        </ChartContainer>

        {summary ? (
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
            {summary.total ? (
              <SummaryStat
                label="Total this period"
                value={summary.total}
                delta={summary.totalDelta}
              />
            ) : null}
            {summary.avgPerDay ? (
              <SummaryStat label="Avg. per day" value={summary.avgPerDay} />
            ) : null}
            {summary.bestDay ? (
              <SummaryStat label="Best day" value={summary.bestDay} />
            ) : null}
            {summary.avgCompletion ? (
              <SummaryStat
                label="Avg. completion time"
                value={summary.avgCompletion}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="hidden items-center gap-1.5 text-[11.5px] text-muted-foreground sm:flex">
      <span
        aria-hidden
        className={cn("block h-2 w-2 rounded-sm")}
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">
        {value}
        {delta ? (
          <span className="ml-1.5 text-[11.5px] font-medium text-emerald-700">
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
