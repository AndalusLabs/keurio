"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeInspection, updateResult } from "@/lib/actions/inspections";
import { isBrlCvStandardCode } from "@/lib/brl-cv-template-meta";
import { isRunItemComplete, type ChecklistItemKind } from "@/lib/inspection-item-meta";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { InspectionStatus, ResultStatus } from "@/types/database";
import { InspectionRunItemRow } from "./inspection-run-item-row";
import {
  groupRunItemsBySection,
  InspectionRunSection,
} from "./inspection-run-section";
import type { PhotoRow } from "./item-photos";

export type RunItem = {
  resultId: string;
  label: string;
  sortOrder: number;
  itemKind: ChecklistItemKind;
  sectionHeading: string | null;
  status: ResultStatus;
  notes: string | null;
  photos: PhotoRow[];
};

/** Client linked to the inspection — same source as PDF / klantgegevens. */
export type RunClientSummary = {
  company_name: string;
  contact_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
};

type Props = {
  inspectionId: string;
  title: string;
  inspectionStatus: InspectionStatus;
  inspectionType: string;
  standardCode?: string | null;
  items: RunItem[];
  client: RunClientSummary | null;
};

function findNextIncompleteId(sorted: RunItem[], afterResultId: string): string | null {
  const incomplete = (i: RunItem) =>
    !isRunItemComplete({
      itemKind: i.itemKind,
      status: i.status,
      notes: i.notes,
    });
  const idx = sorted.findIndex((i) => i.resultId === afterResultId);
  if (idx === -1) return null;
  for (let i = idx + 1; i < sorted.length; i++) {
    if (incomplete(sorted[i])) return sorted[i].resultId;
  }
  for (let i = 0; i < idx; i++) {
    if (incomplete(sorted[i])) return sorted[i].resultId;
  }
  return null;
}

/**
 * Field-optimized inspection runner — dense single-screen layout.
 *
 * Goals:
 *  • As many items visible at once as possible (≈48px row height).
 *  • Single click for Pass/Fail — auto-advances scroll to next incomplete.
 *  • Note/photo only expands on demand; ⚠ red rows auto-expand to force note.
 *  • Sticky progress + filter strip; per-status counts always visible.
 */
export function InspectionRunClient({
  inspectionId,
  title,
  inspectionStatus,
  inspectionType,
  standardCode,
  items,
  client,
}: Props) {
  const router = useRouter();
  const scrollToResultIdRef = useRef<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "fail">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const useSectionLayout =
    isBrlCvStandardCode(standardCode) ||
    inspectionType.includes("BRL") ||
    sorted.some((i) => i.sectionHeading);

  const sections = useMemo(
    () => (useSectionLayout ? groupRunItemsBySection(sorted) : []),
    [sorted, useSectionLayout]
  );

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!useSectionLayout || sections.length === 0) return;
    setExpandedSections((prev) => {
      if (prev.size > 0) return prev;
      const firstIncomplete = sections.find((s) =>
        s.items.some(
          (i) =>
            !isRunItemComplete({
              itemKind: i.itemKind,
              status: i.status,
              notes: i.notes,
            })
        )
      );
      const target = firstIncomplete?.title ?? sections[0]?.title;
      return target ? new Set([target]) : prev;
    });
  }, [sections, useSectionLayout]);

  const total = sorted.length;
  const passCount = sorted.filter(
    (i) =>
      (i.itemKind === "pass_fail" || i.itemKind === "yes_no") && i.status === "pass"
  ).length;
  const failCount = sorted.filter(
    (i) =>
      (i.itemKind === "pass_fail" || i.itemKind === "yes_no") && i.status === "fail"
  ).length;
  const doneCount = sorted.filter((i) =>
    isRunItemComplete({
      itemKind: i.itemKind,
      status: i.status,
      notes: i.notes,
    })
  ).length;
  const pendingCount = total - doneCount;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  const readOnly = inspectionStatus === "completed";
  const allComplete = total > 0 && sorted.every((i) => isRunItemComplete(i));

  const visibleSections = useMemo(() => {
    if (!useSectionLayout) return [];
    if (filter === "all") return sections;

    const match = (i: RunItem) => {
      if (filter === "pending") {
        return !isRunItemComplete({
          itemKind: i.itemKind,
          status: i.status,
          notes: i.notes,
        });
      }
      return (
        (i.itemKind === "pass_fail" || i.itemKind === "yes_no") && i.status === "fail"
      );
    };

    return sections
      .map((s) => ({ ...s, items: s.items.filter(match) }))
      .filter((s) => s.items.length > 0);
  }, [sections, filter, useSectionLayout]);

  function toggleSection(title: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const visible = useMemo(() => {
    if (filter === "pending") {
      return sorted.filter(
        (i) =>
          !isRunItemComplete({
            itemKind: i.itemKind,
            status: i.status,
            notes: i.notes,
          })
      );
    }
    if (filter === "fail") {
      return sorted.filter(
        (i) =>
          (i.itemKind === "pass_fail" || i.itemKind === "yes_no") && i.status === "fail"
      );
    }
    return sorted;
  }, [sorted, filter]);

  useEffect(() => {
    if (!useSectionLayout || filter === "all") return;
    setExpandedSections(new Set(visibleSections.map((s) => s.title)));
  }, [filter, useSectionLayout, visibleSections]);

  useEffect(() => {
    const id = scrollToResultIdRef.current;
    if (!id) return;
    scrollToResultIdRef.current = null;
    requestAnimationFrame(() => {
      document
        .getElementById(`run-item-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [items]);

  async function onSetStatus(
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) {
    if (readOnly) return;
    const res = await updateResult({ resultId, status });
    if (res.error) {
      toast({ title: "Could not save", description: res.error, variant: "destructive" });
      return;
    }
    if (status === "fail") {
      if (useSectionLayout) {
        const section = sections.find((s) =>
          s.items.some((i) => i.resultId === resultId)
        );
        if (section) {
          setExpandedSections((prev) => new Set([...prev, section.title]));
        }
      } else {
        setExpandedId(resultId);
      }
    } else {
      const nextId = findNextIncompleteId(sorted, resultId);
      if (nextId) scrollToResultIdRef.current = nextId;
    }
    router.refresh();
  }

  async function onSaveNotes(resultId: string, notes: string) {
    if (readOnly) return;
    const res = await updateResult({ resultId, notes });
    if (res.error) {
      toast({ title: "Could not save", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function onFinish() {
    if (readOnly) return;
    if (!allComplete) {
      toast({ description: "Please complete all checklist items first", variant: "destructive" });
      return;
    }
    const res = await completeInspection(inspectionId);
    if (res.error) {
      toast({ title: "Not ready", description: res.error, variant: "destructive" });
      return;
    }
    toast({ description: "Inspection completed!" });
    router.push(`/inspections/${inspectionId}`);
    router.refresh();
  }

  if (!total) {
    return <div className="p-6 text-center text-muted-foreground">No checklist items.</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {/* Sticky header — title + progress + filter chips */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
            <Link href="/dashboard" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight text-[#0f3e18]">
              {title}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {doneCount} / {total} done · {progress}%
            </p>
          </div>

          {readOnly ? (
            <Button size="sm" variant="outline" className="h-9 shrink-0" asChild>
              <Link href={`/inspections/${inspectionId}`}>Done</Link>
            </Button>
          ) : null}
        </div>

        {/* Slim progress bar */}
        <div className="mx-auto h-1 max-w-3xl overflow-hidden bg-muted">
          <div
            className="h-full bg-[#0f3e18] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Filter chips with live counts */}
        <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 py-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={total} />
          <FilterChip
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            label="Pending"
            count={pendingCount}
            tone="muted"
          />
          <FilterChip
            active={filter === "fail"}
            onClick={() => setFilter("fail")}
            label="Issues"
            count={failCount}
            tone="danger"
          />
          <div className="ml-auto flex items-center gap-3 text-[11.5px] tabular-nums text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              {passCount} pass
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-600" />
              {failCount} fail
            </span>
          </div>
        </div>
      </header>

      {/* Dense list — same shell as Airco: optional klantkaart + flat checklist */}
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-3 px-4 pb-4 pt-3 md:pb-6">
        {client ? (
          <div className="rounded-lg border border-border/80 bg-card px-3 py-2.5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Klant
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-foreground">{client.company_name}</p>
            {client.contact_name ? (
              <p className="text-[13px] text-muted-foreground">{client.contact_name}</p>
            ) : null}
            <div className="mt-1.5 space-y-0.5 text-[13px] leading-snug text-muted-foreground">
              {[client.address, [client.postal_code, client.city].filter(Boolean).join(" ")].filter(
                Boolean
              ).length ? (
                <p>
                  {[client.address, [client.postal_code, client.city].filter(Boolean).join(" ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {client.phone ? <p>{client.phone}</p> : null}
              {client.email ? <p>{client.email}</p> : null}
            </div>
          </div>
        ) : null}

        {useSectionLayout ? (
          <div className="space-y-2">
            {visibleSections.map((section) => (
              <InspectionRunSection
                key={section.title}
                section={section}
                expanded={expandedSections.has(section.title)}
                onToggle={() => toggleSection(section.title)}
                readOnly={readOnly}
                onSetStatus={onSetStatus}
                onSaveNotes={onSaveNotes}
              />
            ))}
            {visibleSections.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Niets te tonen. Wissel van filter.
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {visible.map((item, i) => {
              const originalIdx = sorted.findIndex((s) => s.resultId === item.resultId);
              return (
                <InspectionRunItemRow
                  key={item.resultId}
                  item={item}
                  displayIndex={originalIdx + 1}
                  inspectionType={inspectionType}
                  readOnly={readOnly}
                  showDivider={i < visible.length - 1}
                  expanded={expandedId === item.resultId}
                  onToggleExpand={() =>
                    setExpandedId((prev) => (prev === item.resultId ? null : item.resultId))
                  }
                  onSetStatus={onSetStatus}
                  onSaveNotes={onSaveNotes}
                />
              );
            })}
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Nothing here. Switch filter to see other items.
              </div>
            ) : null}
          </div>
        )}

        {/* Bottom hint */}
        {!readOnly && allComplete && failCount === 0 ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[13px] font-medium text-emerald-800">
            All clear · ready to finish
          </div>
        ) : null}
      </main>

      {!readOnly ? (
        <footer className="sticky bottom-0 z-20 border-t border-border bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto flex max-w-3xl justify-end px-4">
            <Button
              type="button"
              variant="accent"
              size="lg"
              className={cn("min-w-[11rem]", !allComplete && "opacity-50")}
              onClick={() => void onFinish()}
            >
              Finish inspection
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone = "default",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "default" | "muted" | "danger";
}) {
  const toneCls =
    active && tone === "danger"
      ? "bg-red-600 text-white border-red-600"
      : active
        ? "bg-[#0f3e18] text-white border-[#0f3e18]"
        : "bg-background text-muted-foreground border-border hover:bg-muted";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition-colors",
        toneCls
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
          active ? "bg-white/20 text-white" : "bg-muted text-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}
