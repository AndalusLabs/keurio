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
};

/**
 * Inspection activity chart — paired bars: current period (brand green) vs
 * previous period (pale slate).
 */
function isMonthlySeries(data: ExtendedPoint[]): boolean {
  if (data.length < 10) return false;
  return data.every((point) => point.date.endsWith("-01"));
}

function formatAxisDate(ymd: string, monthly: boolean): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  if (monthly) {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "Europe/Amsterdam",
    }).format(date);
  }
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "Europe/Amsterdam",
  }).format(date);
  return `${day} ${month}`;
}

export function InspectionsActivityChart({ data, monthLabel }: Props) {
  const monthly = isMonthlySeries(data);
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={monthly ? 8 : 14}
              interval={0}
              minTickGap={0}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => formatAxisDate(String(value), monthly)}
              angle={monthly ? 0 : -32}
              textAnchor={monthly ? "middle" : "end"}
              height={monthly ? 30 : 56}
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

