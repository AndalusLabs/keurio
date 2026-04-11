const AMSTERDAM = "Europe/Amsterdam";

/** Calendar date in Amsterdam (YYYY-MM-DD). */
export function getAmsterdamYmd(isoOrDate: string | Date = new Date()): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d
    .toLocaleString("sv-SE", {
      timeZone: AMSTERDAM,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split(" ")[0];
}

/** First day of the calendar month in Amsterdam (YYYY-MM-DD). */
export function getAmsterdamMonthStartYmd(reference = new Date()): string {
  const ymd = getAmsterdamYmd(reference);
  return `${ymd.slice(0, 7)}-01`;
}

/** Date only, Dutch format (stable timezone). */
export function formatInspectionDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

/** Stable across SSR and browser (fixed locale + timezone — avoids hydration mismatch). */
export function formatInspectionDateTime(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AMSTERDAM,
  });
}

/** Short day label for charts (e.g. "3 apr."). */
export function formatChartDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
}

/** Day of month only (for single-month bar charts). */
export function formatChartDayOfMonth(ymd: string): string {
  return String(Number(ymd.split("-")[2]));
}

/** Every calendar day YYYY-MM-DD in the Amsterdam month that contains `reference`. */
export function allDaysInAmsterdamMonth(reference = new Date()): string[] {
  const monthStart = getAmsterdamMonthStartYmd(reference);
  const [y, m] = monthStart.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    days.push(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  return days;
}

/** Long month + year in Amsterdam (e.g. "april 2026"). */
export function formatAmsterdamMonthYearLong(reference = new Date()): string {
  return reference.toLocaleString("nl-NL", {
    month: "long",
    year: "numeric",
    timeZone: AMSTERDAM,
  });
}
