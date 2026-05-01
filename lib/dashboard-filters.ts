export type PeriodKey = "week" | "month" | "year";

export type DashboardFilters = {
  period: PeriodKey;
  status: string[];
  template: string[];
  client: string[];
};

export type FilterOption = { id: string; label: string };

export function parseDashboardFilters(
  sp: Record<string, string | string[] | undefined> | URLSearchParams
): DashboardFilters {
  const getMany = (k: string): string[] => {
    if (sp instanceof URLSearchParams) {
      const direct = sp.getAll(k).flatMap((v) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
      return Array.from(new Set(direct));
    }
    const v = sp[k];
    const raw = Array.isArray(v) ? v : v ? [v] : [];
    return Array.from(
      new Set(
        raw.flatMap((entry) =>
          String(entry)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      )
    );
  };

  const period = sp instanceof URLSearchParams ? sp.get("period") : sp.period;
  const periodValue = Array.isArray(period) ? period[0] : period;
  const validPeriod: PeriodKey =
    periodValue === "week" || periodValue === "year" || periodValue === "month"
      ? periodValue
      : "month";

  return {
    period: validPeriod,
    status: getMany("status"),
    template: getMany("template"),
    client: getMany("client"),
  };
}
