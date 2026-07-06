"use client";

import { ChevronDown } from "lucide-react";
import { isRunItemComplete } from "@/lib/inspection-item-meta";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";
import { InspectionRunField } from "./inspection-run-field";
import type { RunItem } from "./inspection-run-client";

export type RunSection = {
  title: string;
  items: RunItem[];
};

export function groupRunItemsBySection(items: RunItem[]): RunSection[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const sections: RunSection[] = [];

  for (const item of sorted) {
    if (item.sectionHeading) {
      sections.push({ title: item.sectionHeading, items: [{ ...item, sectionHeading: item.sectionHeading }] });
    } else if (sections.length > 0) {
      const last = sections[sections.length - 1]!;
      last.items.push({ ...item, sectionHeading: last.title });
    } else {
      sections.push({ title: "Algemeen", items: [item] });
    }
  }

  return sections;
}

type Props = {
  section: RunSection;
  expanded: boolean;
  onToggle: () => void;
  readOnly: boolean;
  onSetStatus: (
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) => Promise<void>;
  onSaveNotes: (resultId: string, notes: string) => Promise<void>;
};

export function InspectionRunSection({
  section,
  expanded,
  onToggle,
  readOnly,
  onSetStatus,
  onSaveNotes,
}: Props) {
  const total = section.items.length;
  const done = section.items.filter((i) =>
    isRunItemComplete({
      itemKind: i.itemKind,
      status: i.status,
      notes: i.notes,
    })
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 bg-muted/60 px-4 py-3.5 text-left transition-colors hover:bg-muted/80"
        aria-expanded={expanded}
      >
        <span className="flex-1 text-[14px] font-semibold text-[#0f3e18]">{section.title}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {done}/{total}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded ? (
        <div className="border-t border-border/60 bg-background px-4">
          {section.items.map((item) => (
            <InspectionRunField
              key={item.resultId}
              item={item}
              readOnly={readOnly}
              onSetStatus={onSetStatus}
              onSaveNotes={onSaveNotes}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
