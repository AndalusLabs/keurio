import type { ResultStatus } from "@/types/database";

export type ChecklistItemKind = "pass_fail" | "text" | "yes_no";

export function parseItemKind(value: string | null | undefined): ChecklistItemKind {
  if (value === "text" || value === "yes_no") return value;
  return "pass_fail";
}

export function isRunItemComplete(item: {
  itemKind: ChecklistItemKind;
  status: ResultStatus;
  notes: string | null;
}): boolean {
  if (item.itemKind === "text") {
    return Boolean(item.notes?.trim());
  }
  return item.status === "pass" || item.status === "fail";
}

export function displayValueForPdf(
  label: string,
  notes: string | null,
  status: ResultStatus,
  itemKind: ChecklistItemKind,
  inspectionId: string
): string {
  const trimmed = notes?.trim() ?? "";
  if (itemKind === "yes_no") {
    if (status === "pass") return "Ja";
    if (status === "fail") return "Nee";
    return "—";
  }
  if (itemKind === "text") {
    if (trimmed) return trimmed;
    if (/projectnummer/i.test(label)) {
      return `AUTO-${inspectionId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    }
    return "—";
  }
  if (status === "pass") return "In orde";
  if (status === "fail") return "Niet in orde";
  return "—";
}
