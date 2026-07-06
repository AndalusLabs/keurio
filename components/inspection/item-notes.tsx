"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { generateFinding } from "@/lib/actions/ai";
import { updateResult } from "@/lib/actions/inspections";
import { inspectionPhotoPublicUrl } from "@/lib/utils/storage";
import type { PhotoRow } from "./item-photos";

type ItemNotesProps = {
  resultId: string;
  checklistItem: string;
  inspectionType: string;
  photos: PhotoRow[];
  initialNotes: string | null;
  readOnly?: boolean;
};

async function fetchFirstPhotoForAi(
  photos: PhotoRow[]
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" } | null> {
  const first = photos[0];
  if (!first) return null;
  const url = inspectionPhotoPublicUrl(first.storage_path);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type;
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" =
      "image/jpeg";
    if (type === "image/png") mediaType = "image/png";
    else if (type === "image/gif") mediaType = "image/gif";
    else if (type === "image/webp") mediaType = "image/webp";
    else if (!type.startsWith("image/")) return null;

    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);
    return { base64, mediaType };
  } catch {
    return null;
  }
}

export function ItemNotes({
  resultId,
  checklistItem,
  inspectionType,
  photos,
  initialNotes,
  readOnly,
}: ItemNotesProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(88, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    setValue(initialNotes ?? "");
    setAiGenerated(false);
  }, [initialNotes, resultId]);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  async function save() {
    const trimmed = value.trim();
    const initial = (initialNotes ?? "").trim();
    if (trimmed === initial) return;
    setSaving(true);
    await updateResult({
      resultId,
      notes: trimmed.length ? trimmed : null,
    });
    setSaving(false);
    router.refresh();
  }

  async function onGenerate() {
    const raw = value.trim();
    if (!raw || readOnly) return;

    setAiLoading(true);
    setAiGenerated(false);

    let photoBase64: string | undefined;
    let photoMediaType:
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp"
      | undefined;

    const photo = await fetchFirstPhotoForAi(photos);
    if (photo) {
      photoBase64 = photo.base64;
      photoMediaType = photo.mediaType;
    }

    const res = await generateFinding({
      checklistItem,
      rawNotes: raw,
      inspectionType,
      photoBase64,
      photoMediaType,
    });

    setAiLoading(false);

    if ("error" in res) {
      toast({
        title: "AI unavailable",
        description: `${res.error} You can type your findings manually.`,
        variant: "destructive",
      });
      return;
    }

    setValue(res.text);
    setAiGenerated(true);
  }

  const hasNotesForAi = value.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Notes</span>
        {saving ? (
          <span className="text-xs text-muted-foreground">Saving…</span>
        ) : null}
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        readOnly={readOnly}
        onChange={(e) => {
          setValue(e.target.value);
          requestAnimationFrame(() => resizeTextarea());
        }}
        onBlur={() => void save()}
        placeholder="Tap to add a short note…"
        className="min-h-[88px] resize-none overflow-hidden text-base leading-relaxed md:text-base"
        style={{ fontSize: "16px" }}
      />

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          {hasNotesForAi ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] gap-1.5 text-[#0f3e18] hover:text-[#0f3e18]"
              disabled={aiLoading}
              onClick={() => void onGenerate()}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 shrink-0" />
              )}
              Generate with AI
            </Button>
          ) : null}
        </div>
      ) : null}

      {aiGenerated ? (
        <p className="text-xs text-muted-foreground">
          Generated by AI — please review
        </p>
      ) : null}
    </div>
  );
}
