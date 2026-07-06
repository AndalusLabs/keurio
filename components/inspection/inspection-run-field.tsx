"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isRunItemComplete } from "@/lib/inspection-item-meta";
import { cn } from "@/lib/utils";
import type { ResultStatus } from "@/types/database";
import { ItemPhotos } from "./item-photos";
import { SpeechInputButton } from "./speech-input-button";
import type { RunItem } from "./inspection-run-client";

type Props = {
  item: RunItem;
  readOnly: boolean;
  onSetStatus: (
    resultId: string,
    status: Exclude<ResultStatus, null>
  ) => Promise<void>;
  onSaveNotes: (resultId: string, notes: string) => Promise<void>;
};

function fieldUnit(label: string): string | null {
  const m = label.match(/\((ppm|mbar|%)\)/i);
  if (!m?.[1]) return null;
  return m[1].toUpperCase();
}

function isMultilineField(label: string, sectionTitle?: string): boolean {
  if (sectionTitle === "Opmerkingen") return true;
  return /opmerking|gereedschap|instrument/i.test(label);
}

export function InspectionRunField({
  item,
  readOnly,
  onSetStatus,
  onSaveNotes,
}: Props) {
  const [draftNotes, setDraftNotes] = useState(item.notes ?? "");
  const unit = fieldUnit(item.label);
  const multiline = isMultilineField(item.label, item.sectionHeading ?? undefined);
  const complete = isRunItemComplete({
    itemKind: item.itemKind,
    status: item.status,
    notes: item.notes,
  });

  useEffect(() => {
    setDraftNotes(item.notes ?? "");
  }, [item.notes, item.resultId]);

  async function flushNotes() {
    if (readOnly || item.itemKind !== "text") return;
    const next = draftNotes.trim();
    const prev = (item.notes ?? "").trim();
    if (next === prev) return;
    await onSaveNotes(item.resultId, draftNotes);
  }

  async function appendDraft(text: string) {
    if (readOnly) return;
    const next = draftNotes.trim() ? `${draftNotes.trim()} ${text}` : text;
    setDraftNotes(next);
    await onSaveNotes(item.resultId, next);
  }

  async function onSelectStatus(value: string) {
    if (readOnly) return;
    const status: Exclude<ResultStatus, null> =
      value === "pass" || value === "ja" || value === "in-orde" ? "pass" : "fail";
    await onSetStatus(item.resultId, status);
  }

  const selectValue =
    item.itemKind === "yes_no"
      ? item.status === "pass"
        ? "ja"
        : item.status === "fail"
          ? "nee"
          : ""
      : item.itemKind === "pass_fail"
        ? item.status === "pass"
          ? "in-orde"
          : item.status === "fail"
            ? "niet-in-orde"
          : ""
        : "";

  return (
    <div
      id={`run-item-${item.resultId}`}
      className={cn(
        "scroll-mt-28 space-y-2 border-b border-border/40 py-3 last:border-b-0",
        complete && "opacity-100"
      )}
    >
      <label className="block text-[13px] font-medium leading-snug text-foreground">
        {item.label}
      </label>

      {item.itemKind === "text" ? (
        <div className={cn("flex items-start gap-2", !multiline && "block")}>
          <div className={cn("relative min-w-0", multiline ? "flex-1" : "w-full")}>
            {multiline ? (
              <Textarea
                value={draftNotes}
                disabled={readOnly}
                onChange={(e) => setDraftNotes(e.target.value)}
                onBlur={() => void flushNotes()}
                rows={3}
                className="min-h-[72px] resize-y text-[14px]"
                placeholder="Invullen…"
              />
            ) : (
              <Input
                value={draftNotes}
                disabled={readOnly}
                onChange={(e) => setDraftNotes(e.target.value)}
                onBlur={() => void flushNotes()}
                inputMode={unit ? "decimal" : "text"}
                className={cn("h-11 text-[14px]", unit && "pr-14")}
                placeholder="—"
              />
            )}
            {unit && !multiline ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-muted-foreground">
                {unit}
              </span>
            ) : null}
          </div>
          {!readOnly && multiline ? (
            <SpeechInputButton onTranscript={(text) => void appendDraft(text)} />
          ) : null}
        </div>
      ) : null}

      {item.itemKind === "yes_no" ? (
        <Select
          value={selectValue || undefined}
          onValueChange={(v) => void onSelectStatus(v)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-11 text-[14px]">
            <SelectValue placeholder="Kies…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ja">Ja</SelectItem>
            <SelectItem value="nee">Nee</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {item.itemKind === "pass_fail" ? (
        <Select
          value={selectValue || undefined}
          onValueChange={(v) => void onSelectStatus(v)}
          disabled={readOnly}
        >
          <SelectTrigger className="h-11 text-[14px]">
            <SelectValue placeholder="Kies…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-orde">In orde</SelectItem>
            <SelectItem value="niet-in-orde">Niet in orde</SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {item.photos.length > 0 || !readOnly ? (
        <ItemPhotos resultId={item.resultId} photos={item.photos} readOnly={readOnly} />
      ) : null}
    </div>
  );
}
