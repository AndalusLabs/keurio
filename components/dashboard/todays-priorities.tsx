"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, FileClock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Priority = {
  id: string;
  href?: string;
  title: string;
  subtitle: string;
  due: string;
  tone: "danger" | "warn" | "info";
};

const TONE = {
  danger: {
    bar: "bg-[hsl(var(--status-fail-fg))]",
    icon: AlertTriangle,
    iconColor: "text-[hsl(var(--status-fail-fg))]",
    dueColor: "text-[hsl(var(--status-fail-fg))]",
  },
  warn: {
    bar: "bg-[hsl(var(--status-warn-fg))]",
    icon: Clock,
    iconColor: "text-[hsl(var(--status-warn-fg))]",
    dueColor: "text-[hsl(var(--status-warn-fg))]",
  },
  info: {
    bar: "bg-primary",
    icon: FileClock,
    iconColor: "text-primary",
    dueColor: "text-muted-foreground",
  },
} as const;

/**
 * Compact list of time-sensitive items the operator needs to triage today.
 * Each row has a tone bar so the user can scan priority at a glance.
 */
export function TodaysPriorities({
  items,
  className,
}: {
  items: Priority[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Today&apos;s priorities</CardTitle>
        <span className="text-[11px] font-medium text-primary">
          {items.length} items
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="flex flex-col">
          {items.map((item, i) => (
            <PriorityRow key={item.id} item={item} isLast={i === items.length - 1} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PriorityRow({ item, isLast }: { item: Priority; isLast: boolean }) {
  const tone = TONE[item.tone];
  const Icon = tone.icon;
  const content = (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        !isLast && "border-b border-border/60"
      )}
    >
      <div className={cn("mt-1 h-8 w-0.5 rounded-full", tone.bar)} aria-hidden />
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.iconColor)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">
          {item.title}
        </div>
        <div className="truncate text-[11.5px] text-muted-foreground">
          {item.subtitle}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn("text-[11.5px] font-medium tabular-nums", tone.dueColor)}>
          {item.due}
        </span>
        {item.href ? (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          className="-mx-2 block rounded-md px-2 transition-colors hover:bg-muted/70"
        >
          {content}
        </Link>
      </li>
    );
  }
  return <li>{content}</li>;
}
