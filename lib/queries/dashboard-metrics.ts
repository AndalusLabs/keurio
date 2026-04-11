import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import {
  allDaysInAmsterdamMonth,
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
};

export type DashboardMetrics = {
  calendarMonthLabel: string;
  monthTotal: number;
  openCount: number;
  completedCount: number;
  pdfDownloads: number;
  chartData: InspectionsChartPoint[];
};

function emptyChart(reference = new Date()): InspectionsChartPoint[] {
  const now = reference;
  return allDaysInAmsterdamMonth(now).map((date) => ({
    date,
    label: formatChartDayOfMonth(date),
    count: 0,
  }));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return null;

  const reference = new Date();
  const calendarMonthLabel = formatAmsterdamMonthYearLong(reference);

  const inspectionsQuery = supabase
    .from("inspections")
    .select("created_at, status")
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
    return {
      calendarMonthLabel,
      monthTotal: 0,
      openCount: 0,
      completedCount: 0,
      pdfDownloads: !pdfCountRes.error ? (pdfCountRes.count ?? 0) : 0,
      chartData: emptyChart(reference),
    };
  }

  const monthStart = getAmsterdamMonthStartYmd(reference);
  let monthTotal = 0;
  let openCount = 0;
  let completedCount = 0;
  const perDay = new Map<string, number>();

  for (const row of rows) {
    const status = row.status as InspectionStatus;
    const createdKey = getAmsterdamYmd(row.created_at);
    if (createdKey >= monthStart) monthTotal += 1;
    if (status === "in_progress") openCount += 1;
    if (status === "completed") completedCount += 1;
    perDay.set(createdKey, (perDay.get(createdKey) ?? 0) + 1);
  }

  const monthDays = allDaysInAmsterdamMonth(reference);
  const chartData = monthDays.map((date) => ({
    date,
    label: formatChartDayOfMonth(date),
    count: perDay.get(date) ?? 0,
  }));

  return {
    calendarMonthLabel,
    monthTotal,
    openCount,
    completedCount,
    pdfDownloads: !pdfCountRes.error ? (pdfCountRes.count ?? 0) : 0,
    chartData,
  };
}
