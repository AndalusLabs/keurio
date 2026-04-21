"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";
import { ItemNotes } from "./item-notes";
import { ItemPhotos } from "./item-photos";
import type { RunItem } from "./inspection-run-client";

export type InspectionRunItemCardProps = {
  item: RunItem;
  displayIndex: number;
  inspectionType: string;
  readOnly: boolean;
  isLast: boolean;
  onSetStatus: (
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) => Promise<void>;
};

export function InspectionRunItemCard({
  item,
  displayIndex,
  inspectionType,
  readOnly,
  isLast,
  onSetStatus,
}: InspectionRunItemCardProps) {
  const hasNotesOrPhotos = Boolean(item.notes?.trim()) || item.photos.length > 0;
  const [expanded, setExpanded] = useState(
    item.status === "fail" || hasNotesOrPhotos
  );

  useEffect(() => {
    if (item.status === "fail") {
      setExpanded(true);
    }
  }, [item.status]);

  useEffect(() => {
    if (hasNotesOrPhotos) {
      setExpanded(true);
    }
  }, [hasNotesOrPhotos]);

  async function onPass() {
    await onSetStatus(item.resultId, "pass");
  }

  async function onFail() {
    setExpanded(true);
    await onSetStatus(item.resultId, "fail");
  }

  return (
    <div
      id={`run-item-${item.resultId}`}
      className={cn(
        "scroll-mt-24 px-4 py-3",
        !isLast && "border-b border-border/70",
        item.status === "pass" && "bg-green-50/80",
        item.status === "fail" && "bg-red-50/80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-[14px] font-medium leading-snug text-foreground">
          {displayIndex}. {item.label}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={readOnly}
            onClick={() => void onPass()}
            className={cn(
              "min-h-[44px] rounded-md border px-3 text-sm font-medium transition-colors",
              item.status === "pass"
                ? "border-green-600 bg-[#b2dbb8] text-[#0f3e18]"
                : "border-border bg-background text-muted-foreground hover:border-[#0f3e18]/40"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Pass
            </span>
          </button>
          <button
            type="button"
            disabled={readOnly}
            onClick={() => void onFail()}
            className={cn(
              "min-h-[44px] rounded-md border px-3 text-sm font-medium transition-colors",
              item.status === "fail"
                ? "border-red-600 bg-red-100 text-red-700"
                : "border-border bg-background text-muted-foreground hover:border-red-400/70"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <X className="h-4 w-4" />
              Fail
            </span>
          </button>
        </div>
      </div>

      {!readOnly ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-sm font-medium text-[#0f3e18] underline underline-offset-4"
        >
          {expanded ? "Hide note" : "Add note"}
        </button>
      ) : null}

      {expanded ? (
        <div className="mt-3 space-y-4">
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
      ) : null}
    </div>
  );
}
