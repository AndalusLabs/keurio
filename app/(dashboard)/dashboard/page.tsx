import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import {
  DashboardFilterBar,
} from "@/components/dashboard/dashboard-filter-bar";
import { InspectionsMetricsDashboard } from "@/components/dashboard/inspections-metrics-dashboard";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import {
  TodaysPriorities,
  type Priority,
} from "@/components/dashboard/todays-priorities";
import { Button } from "@/components/ui/button";
import {
  getClientOptions,
  getDashboardMetrics,
  getStatusOptions,
  getTemplateOptions,
} from "@/lib/queries/dashboard-metrics";
import { parseDashboardFilters } from "@/lib/dashboard-filters";
import { getUserDisplayName } from "@/lib/queries/user-display";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

function greetingName(full: string | null): string {
  if (!full) return "there";
  return full.trim().split(/\s+/)[0] ?? "there";
}

function formatWeekday(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

function formatDayMonth(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    day: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

/**
 * Sample priorities — pulled from scheduled/overdue inspections once the
 * back-end query lands. Keeping the shape here so the UI renders immediately.
 */
const SAMPLE_PRIORITIES: Priority[] = [
  {
    id: "p1",
    title: "Cold Storage — Bakker & Zoon",
    subtitle: "Failed check · awaiting re-inspection",
    due: "Due today",
    tone: "danger",
    href: "/inspections",
  },
  {
    id: "p2",
    title: "Fire Safety Audit — Meridian",
    subtitle: "68% complete · 4 photos pending",
    due: "2h left",
    tone: "warn",
    href: "/inspections",
  },
  {
    id: "p3",
    title: "Quarterly HVAC — Westfield",
    subtitle: "Scheduled with Jonas",
    due: "3:30 PM",
    tone: "info",
    href: "/inspections",
  },
];

type DashboardHomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseDashboardFilters(resolvedSearchParams);

  const [metrics, displayName, statuses, templates, clients] = await Promise.all([
    getDashboardMetrics(filters),
    getUserDisplayName(),
    getStatusOptions(),
    getTemplateOptions(),
    getClientOptions(),
  ]);

  const today = new Date();
  const firstName = greetingName(displayName);

  return (
    <div className="space-y-8">
      {/* Hero row — greeting + right-aligned quick actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <DashboardHero
          name={firstName}
          weekday={formatWeekday(today)}
          date={formatDayMonth(today)}
        />
        <div className="flex items-center gap-2 lg:pt-1">
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export report
          </Button>
          <Button asChild className="gap-1.5">
            <Link href="/inspections/new">
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              New inspection
            </Link>
          </Button>
        </div>
      </div>

      <DashboardFilterBar
        initial={filters}
        statuses={statuses}
        templates={templates}
        clients={clients}
      />

      {/* KPIs + chart, with QuickActions + Priorities stacked to the right */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {metrics ? <InspectionsMetricsDashboard metrics={metrics} /> : null}
        </div>
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <QuickActionsCard />
          <TodaysPriorities items={SAMPLE_PRIORITIES} />
        </aside>
      </div>
    </div>
  );
}
