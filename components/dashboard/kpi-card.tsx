"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "brand" | "amber" | "danger";
type Trend = "up" | "down" | "flat";

export type KpiCardProps = {
  label: string;
  value: string | number;
  /** Signed delta, e.g. "+12.4%" or "−4". Shown next to the value. */
  delta?: string;
  trend?: Trend;
  tone?: Tone;
  /** Numeric series rendered as a tiny sparkline bar chart. */
  spark?: number[];
  /** Small supporting copy under the value — context for the number. */
  subtitle?: string;
  /** Call out as the "hero" metric — slightly warmer card background. */
  highlight?: boolean;
  className?: string;
};

const TONE = {
  default: { chip: "text-emerald-700", fill: "#1a8a3a" },
  brand: { chip: "text-primary", fill: "#0f3e18" },
  amber: { chip: "text-[hsl(var(--status-warn-fg))]", fill: "#d9820a" },
  danger: { chip: "text-[hsl(var(--status-fail-fg))]", fill: "#b42318" },
} as const;

/**
 * Premium KPI card — large metric, delta pill, contextual subtitle, tiny
 * sparkline. Highlight variant reserved for the lead number on the page.
 */
export function KpiCard({
  label,
  value,
  delta,
  trend = "up",
  tone = "default",
  spark,
  subtitle,
  highlight,
  className,
}: KpiCardProps) {
  const trendPositive = trend === "up";
  const deltaColor =
    trend === "flat"
      ? "text-muted-foreground"
      : trendPositive
        ? "text-emerald-700"
        : "text-[hsl(var(--status-fail-fg))]";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-5 shadow-card transition-shadow hover:shadow-card-hover",
        highlight
          ? "border-primary/15 bg-secondary"
          : "border-border bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-medium text-muted-foreground">
          {label}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              deltaColor,
              trend === "up" && "bg-[hsl(var(--status-pass-bg))]",
              trend === "down" && "bg-[hsl(var(--status-fail-bg))]",
              trend === "flat" && "bg-muted"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {delta}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="text-metric font-semibold tabular-nums text-foreground">
          {value}
        </div>
        {spark && spark.length > 0 ? (
          <Sparkline values={spark} color={TONE[tone].fill} />
        ) : null}
      </div>

      {subtitle ? (
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 68;
  const H = 24;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = W / values.length;
  const barW = Math.max(step - 1.5, 1);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0"
      aria-hidden
    >
      {values.map((v, i) => {
        const h = ((v - min) / range) * (H - 4) + 4;
        return (
          <rect
            key={i}
            x={i * step}
            y={H - h}
            width={barW}
            height={h}
            rx={1}
            fill={color}
            opacity={i === values.length - 1 ? 1 : 0.28 + (i / values.length) * 0.45}
          />
        );
      })}
    </svg>
  );
}
