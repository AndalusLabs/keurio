"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Dashboard hero — oversized greeting with secondary "what's moving today" phrase.
 * The eyebrow carries day-of-week + date so you get context at a glance.
 */
export function DashboardHero({
  name,
  date,
  weekday,
  className,
}: {
  name: string;
  date: string;      // e.g. "April 22"
  weekday: string;   // e.g. "Wednesday"
  className?: string;
}) {
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="eyebrow text-primary">
        DASHBOARD · {weekday.toUpperCase()}, {date.toUpperCase()}
      </div>
      <h1 className="max-w-3xl text-hero font-semibold">
        {greeting}, {name}.
        <span className="font-normal text-muted-foreground">
          {" "}
          Here&apos;s what&apos;s moving today.
        </span>
      </h1>
    </div>
  );
}
