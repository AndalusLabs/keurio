import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import { getTemplatesForUser } from "@/lib/queries/inspections";
import type {
  DashboardFilters,
  FilterOption,
  PeriodKey,
} from "@/lib/dashboard-filters";
import {
  formatAmsterdamMonthYearLong,
  formatChartDayOfMonth,
  getAmsterdamMonthStartYmd,
  getAmsterdamYmd,
} from "@/lib/utils/date";
import type { InspectionStatus } from "@/types/database";

export type InspectionsChartPoint = {
  date: string;
  label: string;
  count: number;
  previous?: number;
};

type ChartSummary = {
  total: number;
  previousTotal: number;
  avgPerDay: number;
  bestDay: { label: string; count: number } | null;
};

export type DashboardMetrics = {
  calendarMonthLabel: string;
  monthTotal: number;
  monthTotalDelta: string | null;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  passRate: number | null;
  pdfDownloads: number;
  chartData: InspectionsChartPoint[];
  chartSummary: ChartSummary;
};

type InspectionLite = {
  created_at: string;
  status: InspectionStatus;
  template_id: string;
  client_id: string | null;
};

const DEFAULT_FILTERS: DashboardFilters = {
  period: "month",
  status: [],
  template: [],
  client: [],
};

function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}

function dateToYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysYmd(ymd: string, days: number): string {
  const d = ymdToDate(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToYmd(d);
}

function diffDaysInclusive(startYmd: string, endYmd: string): number {
  const start = ymdToDate(startYmd).getTime();
  const end = ymdToDate(endYmd).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function titleForPeriod(period: PeriodKey, reference: Date): string {
  if (period === "week") return "Last 7 days";
  if (period === "year") return "Last 12 months";
  return formatAmsterdamMonthYearLong(reference);
}

function getPeriodBounds(period: PeriodKey, reference: Date) {
  const end = getAmsterdamYmd(reference);
  if (period === "week") {
    const start = addDaysYmd(end, -6);
    return { start, end };
  }
  if (period === "year") {
    const start = addDaysYmd(end, -364);
    return { start, end };
  }
  return {
    start: getAmsterdamMonthStartYmd(reference),
    end,
  };
}

function monthKeyFromYmd(ymd: string): string {
  return ymd.slice(0, 7);
}

function monthKeyFromDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
}

function buildDailyChart(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  rows: InspectionLite[]
): InspectionsChartPoint[] {
  const rangeDays = diffDaysInclusive(currentStart, currentEnd);
  const perDayCurrent = new Map<string, number>();
  const perDayPrevious = new Map<string, number>();

  for (const row of rows) {
    const key = getAmsterdamYmd(row.created_at);
    if (key >= currentStart && key <= currentEnd) {
      perDayCurrent.set(key, (perDayCurrent.get(key) ?? 0) + 1);
    } else {
      const previousEnd = addDaysYmd(previousStart, rangeDays - 1);
      if (key >= previousStart && key <= previousEnd) {
        perDayPrevious.set(key, (perDayPrevious.get(key) ?? 0) + 1);
      }
    }
  }

  const points: InspectionsChartPoint[] = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const day = addDaysYmd(currentStart, i);
    const prevDay = addDaysYmd(previousStart, i);
    points.push({
      date: day,
      label: formatChartDayOfMonth(day),
      count: perDayCurrent.get(day) ?? 0,
      previous: perDayPrevious.get(prevDay) ?? 0,
    });
  }
  return points;
}

function buildYearlyChart(rows: InspectionLite[], reference: Date): InspectionsChartPoint[] {
  const currentMonthStart = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1)
  );
  const currentKeys = Array.from({ length: 12 }, (_, i) =>
    monthKeyFromDate(addMonths(currentMonthStart, i - 11))
  );
  const previousKeys = Array.from({ length: 12 }, (_, i) =>
    monthKeyFromDate(addMonths(currentMonthStart, i - 23))
  );

  const perMonth = new Map<string, number>();
  for (const row of rows) {
    const key = monthKeyFromYmd(getAmsterdamYmd(row.created_at));
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
  }

  return currentKeys.map((key, i) => ({
    date: `${key}-01`,
    label: monthLabelFromKey(key),
    count: perMonth.get(key) ?? 0,
    previous: perMonth.get(previousKeys[i] ?? "") ?? 0,
  }));
}

function deltaLabel(current: number, previous: number): string | null {
  if (previous <= 0) return current > 0 ? "new" : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "0%";
  const sign = pct > 0 ? "+" : "−";
  return `${sign}${Math.abs(pct)}%`;
}

function emptyMetrics(title: string): DashboardMetrics {
  return {
    calendarMonthLabel: title,
    monthTotal: 0,
    monthTotalDelta: null,
    openCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    passRate: null,
    pdfDownloads: 0,
    chartData: [],
    chartSummary: {
      total: 0,
      previousTotal: 0,
      avgPerDay: 0,
      bestDay: null,
    },
  };
}

export async function getDashboardMetrics(
  filters: DashboardFilters = DEFAULT_FILTERS
): Promise<DashboardMetrics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return null;

  const reference = new Date();
  const calendarMonthLabel = titleForPeriod(filters.period, reference);

  const inspectionsQuery = supabase
    .from("inspections")
    .select("created_at, status, template_id, client_id")
    .eq("organization_id", ctx.organizationId);

  if (ctx.role === "technician") {
    inspectionsQuery.eq("user_id", user.id);
  }

  const [{ data: rows, error }, pdfCountRes] = await Promise.all([
    inspectionsQuery,
    supabase
      .from("inspection_pdf_downloads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (error || !rows) {
    const empty = emptyMetrics(calendarMonthLabel);
    empty.pdfDownloads = !pdfCountRes.error ? (pdfCountRes.count ?? 0) : 0;
    return empty;
  }

  const baseRows = rows as InspectionLite[];

  let openCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;

  for (const row of baseRows) {
    if (row.status === "draft") openCount += 1;
    if (row.status === "in_progress") inProgressCount += 1;
    if (row.status === "completed") completedCount += 1;
  }

  const filteredRows = baseRows.filter((row) => {
    if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
    if (filters.template.length > 0 && !filters.template.includes(row.template_id)) return false;
    if (filters.client.length > 0 && !filters.client.includes(row.client_id ?? "")) return false;
    return true;
  });

  const { start: currentStart, end: currentEnd } = getPeriodBounds(
    filters.period,
    reference
  );
  const rangeDays = diffDaysInclusive(currentStart, currentEnd);
  const previousEnd = addDaysYmd(currentStart, -1);
  const previousStart = addDaysYmd(previousEnd, -(rangeDays - 1));

  const monthTotal = filteredRows.filter((row) => {
    const key = getAmsterdamYmd(row.created_at);
    return key >= currentStart && key <= currentEnd;
  }).length;

  const previousTotal = filteredRows.filter((row) => {
    const key = getAmsterdamYmd(row.created_at);
    return key >= previousStart && key <= previousEnd;
  }).length;

  const chartData =
    filters.period === "year"
      ? buildYearlyChart(filteredRows, reference)
      : buildDailyChart(currentStart, currentEnd, previousStart, filteredRows);

  const chartTotal = chartData.reduce((sum, point) => sum + point.count, 0);
  const bestDay =
    chartData.reduce<InspectionsChartPoint | null>(
      (best, point) => (best == null || point.count > best.count ? point : best),
      null
    ) ?? null;

  const completedLikeTotal = completedCount + inProgressCount + openCount;
  const passRate =
    completedLikeTotal > 0 ? (completedCount / completedLikeTotal) * 100 : null;

  return {
    calendarMonthLabel,
    monthTotal,
    monthTotalDelta: deltaLabel(monthTotal, previousTotal),
    openCount,
    inProgressCount,
    completedCount,
    passRate,
    pdfDownloads: !pdfCountRes.error ? (pdfCountRes.count ?? 0) : 0,
    chartData,
    chartSummary: {
      total: chartTotal,
      previousTotal,
      avgPerDay: chartData.length > 0 ? Number((chartTotal / chartData.length).toFixed(1)) : 0,
      bestDay: bestDay
        ? {
            label: bestDay.label,
            count: bestDay.count,
          }
        : null,
    },
  };
}

export async function getStatusOptions(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const { data, error } = await supabase
    .from("inspections")
    .select("status")
    .eq("organization_id", ctx.organizationId);

  if (error || !data) return [];

  const labels: Record<InspectionStatus, string> = {
    draft: "Draft",
    in_progress: "In progress",
    completed: "Completed",
  };

  const seen = new Set<string>();
  for (const row of data) {
    if (row.status) seen.add(row.status);
  }

  return Array.from(seen)
    .sort()
    .map((id) => ({
      id,
      label: labels[id as InspectionStatus] ?? id,
    }));
}

export async function getTemplateOptions(): Promise<FilterOption[]> {
  const templates = await getTemplatesForUser();
  return templates
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      id: t.id,
      label: t.name,
    }));
}

export async function getClientOptions(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name")
    .eq("organization_id", ctx.organizationId)
    .order("company_name", { ascending: true });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    label: c.company_name,
  }));
}
