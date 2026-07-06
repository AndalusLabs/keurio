import type { ChecklistItemKind } from "@/lib/inspection-item-meta";

export const BRL_CV_STANDARD_CODE = "BRL 6000-25";

type BrlItemMeta = {
  itemKind: ChecklistItemKind;
  sectionHeading: string | null;
};

/** Canonical BRL CV field metadata by sort_order (matches migration 00021). */
export const BRL_CV_ITEM_META: Record<number, BrlItemMeta> = {
  0: { itemKind: "text", sectionHeading: "Toestelgegevens & documentatie" },
  1: { itemKind: "text", sectionHeading: null },
  2: { itemKind: "text", sectionHeading: null },
  3: { itemKind: "yes_no", sectionHeading: null },
  4: { itemKind: "text", sectionHeading: "CO vóór werkzaamheden" },
  5: { itemKind: "yes_no", sectionHeading: "Onderhoudsstatus" },
  6: { itemKind: "text", sectionHeading: null },
  7: { itemKind: "yes_no", sectionHeading: null },
  8: { itemKind: "text", sectionHeading: "Gasvoorziening" },
  9: { itemKind: "text", sectionHeading: null },
  10: { itemKind: "text", sectionHeading: null },
  11: { itemKind: "pass_fail", sectionHeading: null },
  12: { itemKind: "text", sectionHeading: "Verbrandingsmetingen" },
  13: { itemKind: "text", sectionHeading: null },
  14: { itemKind: "text", sectionHeading: null },
  15: { itemKind: "text", sectionHeading: null },
  16: { itemKind: "text", sectionHeading: null },
  17: { itemKind: "text", sectionHeading: null },
  18: { itemKind: "pass_fail", sectionHeading: "Rookgasafvoer" },
  19: { itemKind: "text", sectionHeading: null },
  20: { itemKind: "text", sectionHeading: null },
  21: { itemKind: "pass_fail", sectionHeading: null },
  22: { itemKind: "pass_fail", sectionHeading: null },
  23: { itemKind: "pass_fail", sectionHeading: null },
  24: { itemKind: "yes_no", sectionHeading: null },
  25: { itemKind: "pass_fail", sectionHeading: null },
  26: { itemKind: "yes_no", sectionHeading: "Opstellingsruimte" },
  27: { itemKind: "pass_fail", sectionHeading: null },
  28: { itemKind: "pass_fail", sectionHeading: null },
  29: { itemKind: "yes_no", sectionHeading: null },
  30: { itemKind: "yes_no", sectionHeading: "Eindcontrole" },
  31: { itemKind: "text", sectionHeading: "CO na werkzaamheden" },
  32: { itemKind: "text", sectionHeading: "Meetapparatuur" },
  33: { itemKind: "text", sectionHeading: "Opmerkingen" },
};

export function isBrlCvStandardCode(code: string | null | undefined): boolean {
  return code === BRL_CV_STANDARD_CODE;
}

export function enrichBrlRunItem<T extends {
  sortOrder: number;
  itemKind: ChecklistItemKind;
  sectionHeading: string | null;
}>(item: T, standardCode: string | null | undefined): T {
  if (!isBrlCvStandardCode(standardCode)) return item;
  const meta = BRL_CV_ITEM_META[item.sortOrder];
  if (!meta) return item;
  return {
    ...item,
    itemKind: meta.itemKind,
    sectionHeading: item.sectionHeading ?? meta.sectionHeading,
  };
}
