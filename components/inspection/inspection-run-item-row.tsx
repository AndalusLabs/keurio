"use client";

import { Check, ChevronDown, ImageIcon, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { isRunItemComplete } from "@/lib/inspection-item-meta";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";
import { Textarea } from "@/components/ui/textarea";
import { ItemNotes } from "./item-notes";
import { ItemPhotos } from "./item-photos";
import { SpeechInputButton } from "./speech-input-button";
import type { RunItem } from "./inspection-run-client";

type Props = {
  item: RunItem;
  displayIndex: number;
  inspectionType: string;
  readOnly: boolean;
  showDivider: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onSetStatus: (
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) => Promise<void>;
  onSaveNotes: (resultId: string, notes: string) => Promise<void>;
};

/**
 * Compact row — pass/fail, ja/nee, or inline text (BRL / structured templates).
 */
export function InspectionRunItemRow({
  item,
  displayIndex,
  inspectionType,
  readOnly,
  showDivider,
  expanded,
  onToggleExpand,
  onSetStatus,
  onSaveNotes,
}: Props) {
  const hasNote = Boolean(item.notes?.trim());
  const photoCount = item.photos.length;
  const complete = isRunItemComplete({
    itemKind: item.itemKind,
    status: item.status,
    notes: item.notes,
  });

  const [draftNotes, setDraftNotes] = useState(item.notes ?? "");
  useEffect(() => {
    setDraftNotes(item.notes ?? "");
  }, [item.notes, item.resultId]);

  async function onPass(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "pass");
  }
  async function onFail(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "fail");
  }

  async function onJa(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "pass");
  }
  async function onNee(e: React.MouseEvent) {
    e.stopPropagation();
    await onSetStatus(item.resultId, "fail");
  }

  async function appendDraft(text: string) {
    if (readOnly) return;
    const next = draftNotes.trim() ? `${draftNotes.trim()} ${text}` : text;
    setDraftNotes(next);
    await onSaveNotes(item.resultId, next);
  }

  async function flushNotes() {
    if (readOnly || item.itemKind !== "text") return;
    const next = draftNotes.trim();
    const prev = (item.notes ?? "").trim();
    if (next === prev) return;
    await onSaveNotes(item.resultId, draftNotes);
  }

  const rowTone =
    item.itemKind === "yes_no"
      ? item.status === "pass"
        ? "bg-emerald-50/50"
        : item.status === "fail"
          ? "bg-red-50/60"
          : ""
      : "";

  if (item.itemKind === "text") {
    const textTone = complete ? "bg-emerald-50/50" : "";
    return (
      <div
        id={`run-item-${item.resultId}`}
        className={cn(
          "scroll-mt-28 transition-colors",
          showDivider && "border-b border-border/60",
          textTone
        )}
      >
        <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-start">
          <div className="flex w-full items-start gap-3 sm:min-w-0 sm:flex-1">
            <span className="mt-0.5 inline-flex h-6 min-w-[1.375rem] shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/80 px-1 text-[11px] font-semibold tabular-nums text-foreground">
              {displayIndex}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[13.5px] font-medium leading-snug text-foreground">{item.label}</p>
              <div className="flex items-start gap-2">
                <Textarea
                  value={draftNotes}
                  disabled={readOnly}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  onBlur={() => void flushNotes()}
                  onClick={(e) => e.stopPropagation()}
                  rows={2}
                  className="min-h-[52px] flex-1 resize-y text-[13px]"
                  placeholder="Waarde invullen…"
                />
                {!readOnly ? (
                  <SpeechInputButton
                    onTranscript={(text) => void appendDraft(text)}
                  />
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
            {photoCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                {photoCount}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted"
              aria-expanded={expanded}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              />
            </button>
          </div>
        </div>
        {expanded ? (
          <div className="border-t border-border/50 bg-background px-3 py-3">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Item {displayIndex} · {item.label}
            </div>
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

  if (item.itemKind === "yes_no") {
    return (
      <div
        id={`run-item-${item.resultId}`}
        className={cn("scroll-mt-28 transition-colors", showDivider && "border-b border-border/60", rowTone)}
      >
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
          <span className="inline-flex h-6 min-w-[1.375rem] shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/80 px-1 text-[11px] font-semibold tabular-nums text-foreground">
            {displayIndex}
          </span>
          <p className="flex-1 truncate text-[13.5px] font-medium leading-snug text-foreground">
            {item.label}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={onJa}
              className={cn(
                "h-9 rounded-md border px-3 text-[12px] font-semibold transition-colors disabled:opacity-40",
                item.status === "pass"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-emerald-600"
              )}
            >
              Ja
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={onNee}
              className={cn(
                "h-9 rounded-md border px-3 text-[12px] font-semibold transition-colors disabled:opacity-40",
                item.status === "fail"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-red-600"
              )}
            >
              Nee
            </button>
            <ChevronDown
              className={cn(
                "ml-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>
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

  return (
    <div
      id={`run-item-${item.resultId}`}
      className={cn(
        "scroll-mt-28 transition-colors",
        showDivider && "border-b border-border/60",
        item.status === "pass" && "bg-emerald-50/50",
        item.status === "fail" && "bg-red-50/60"
      )}
    >
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
        <span className="inline-flex h-6 min-w-[1.375rem] shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/80 px-1 text-[11px] font-semibold tabular-nums text-foreground">
          {displayIndex}
        </span>

        <p className="flex-1 truncate text-[13.5px] font-medium leading-snug text-foreground">
          {item.label}
        </p>

        <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          {hasNote ? <MessageSquare className="h-3.5 w-3.5" /> : null}
          {photoCount > 0 ? (
            <span className="inline-flex items-center gap-0.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {photoCount}
            </span>
          ) : null}
        </div>

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
