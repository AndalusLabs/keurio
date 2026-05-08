"use client";

import { Check, ChevronDown, ImageIcon, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";
import { ItemNotes } from "./item-notes";
import { ItemPhotos } from "./item-photos";
import type { RunItem } from "./inspection-run-client";

type Props = {
  item: RunItem;
  displayIndex: number;
  inspectionType: string;
  readOnly: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onSetStatus: (
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) => Promise<void>;
};

/**
 * Compact row — ~52px tall when collapsed. Click anywhere to expand inline
 * notes/photos. Pass/Fail are circular icon buttons (square→pill on tap).
 */
export function InspectionRunItemRow({
  item,
  displayIndex,
  inspectionType,
  readOnly,
  isLast,
  expanded,
  onToggleExpand,
  onSetStatus,
}: Props) {
  const hasNote = Boolean(item.notes?.trim());
  const photoCount = item.photos.length;

  async function onPass(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "pass");
  }
  async function onFail(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "fail");
  }

  return (
    <div
      id={`run-item-${item.resultId}`}
      className={cn(
        "scroll-mt-28 transition-colors",
        !isLast && "border-b border-border/60",
        item.status === "pass" && "bg-emerald-50/50",
        item.status === "fail" && "bg-red-50/60"
      )}
    >
      {/* Collapsed row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
      >
        {/* Index — always visible; pass/fail is shown only on the action buttons */}
        <span className="inline-flex h-6 min-w-[1.375rem] shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/80 px-1 text-[11px] font-semibold tabular-nums text-foreground">
          {displayIndex}
        </span>

        {/* Label */}
        <p className="flex-1 truncate text-[13.5px] font-medium leading-snug text-foreground">
          {item.label}
        </p>

        {/* Note/photo indicators */}
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          {hasNote ? <MessageSquare className="h-3.5 w-3.5" /> : null}
          {photoCount > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {photoCount}
            </span>
          ) : null}
        </div>

        {/* Pass / Fail */}
        <div className="flex shrink-0 items-center gap-1">
          <PassFailButton
            kind="pass"
            active={item.status === "pass"}
            disabled={readOnly}
            onClick={onPass}
          />
          <PassFailButton
            kind="fail"
            active={item.status === "fail"}
            disabled={readOnly}
            onClick={onFail}
          />
          <ChevronDown
            className={cn(
              "ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Expanded note + photos */}
      {expanded ? (
        <div className="border-t border-border/50 bg-background px-3 py-3">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Item {displayIndex} · {item.label}
          </div>
          <div className="space-y-3">
            <ItemNotes
              resultId={item.resultId}
              checklistItem={item.label}
              inspectionType={inspectionType}
              photos={item.photos}
              initialNotes={item.notes}
              readOnly={readOnly}
            />
            <ItemPhotos
              resultId={item.resultId}
              photos={item.photos}
              readOnly={readOnly}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PassFailButton({
  kind,
  active,
  disabled,
  onClick,
}: {
  kind: "pass" | "fail";
  active: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = kind === "pass" ? Check : X;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={kind === "pass" ? "Mark pass" : "Mark fail"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:opacity-40",
        active && kind === "pass" && "border-emerald-600 bg-emerald-600 text-white",
        active && kind === "fail" && "border-red-600 bg-red-600 text-white",
        !active && kind === "pass" && "border-border bg-background text-muted-foreground hover:border-emerald-600 hover:text-emerald-700",
        !active && kind === "fail" && "border-border bg-background text-muted-foreground hover:border-red-600 hover:text-red-700"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
