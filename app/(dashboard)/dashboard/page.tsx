import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import {
  DashboardFilterBar,
} from "@/components/dashboard/dashboard-filter-bar";
import { GetStartedChecklistCard } from "@/components/dashboard/get-started-checklist-card";
import { InspectionsMetricsDashboard } from "@/components/dashboard/inspections-metrics-dashboard";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { Button } from "@/components/ui/button";
import {
  getClientOptions,
  getDashboardMetrics,
  getStatusOptions,
  getTemplateOptions,
} from "@/lib/queries/dashboard-metrics";
import { parseDashboardFilters } from "@/lib/dashboard-filters";
import { getOnboardingChecklistStatus } from "@/lib/queries/onboarding-checklist";
import { getUserDisplayName } from "@/lib/queries/user-display";
import { Plus } from "lucide-react";
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

type DashboardHomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseDashboardFilters(resolvedSearchParams);

  const [metrics, displayName, statuses, templates, clients, checklistStatus] = await Promise.all([
    getDashboardMetrics(filters),
    getUserDisplayName(),
    getStatusOptions(),
    getTemplateOptions(),
    getClientOptions(),
    getOnboardingChecklistStatus(),
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

      {/* KPIs + chart with quick actions aside */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {metrics ? <InspectionsMetricsDashboard metrics={metrics} /> : null}
        </div>
        <aside className="flex flex-col gap-6 xl:h-full xl:justify-between">
          <QuickActionsCard className="min-h-[176px]" />
          {checklistStatus && !checklistStatus.allComplete ? (
            <GetStartedChecklistCard status={checklistStatus} className="min-h-[236px]" />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
