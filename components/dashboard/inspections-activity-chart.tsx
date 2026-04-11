"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
import type { InspectionsChartPoint } from "@/lib/queries/dashboard-metrics";

const chartConfig = {
  count: {
    label: "Inspections",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type Props = {
  data: InspectionsChartPoint[];
  monthLabel: string;
};

export function InspectionsActivityChart({ data, monthLabel }: Props) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary">
          Activity — {monthLabel}
        </CardTitle>
        <CardDescription>
          Inspections created per day for the full calendar month.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              minTickGap={0}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as InspectionsChartPoint | undefined;
                    return row?.date ?? "";
                  }}
                />
              }
              cursor={{ fill: "hsl(var(--accent) / 0.35)" }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[5, 5, 0, 0]}
              maxBarSize={48}
              activeBar={{
                fill: "hsl(var(--accent))",
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
