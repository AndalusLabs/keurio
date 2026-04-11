"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { updateResult } from "@/lib/actions/inspections";

type ItemNotesProps = {
  resultId: string;
  initialNotes: string | null;
  readOnly?: boolean;
};

export function ItemNotes({
  resultId,
  initialNotes,
  readOnly,
}: ItemNotesProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialNotes ?? "");
  }, [initialNotes, resultId]);

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Notes</span>
        {saving ? (
          <span className="text-xs text-muted-foreground">Saving…</span>
        ) : null}
      </div>
      <Textarea
        value={value}
        readOnly={readOnly}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void save()}
        placeholder="Tap to add a short note…"
        className="min-h-[88px] resize-none text-base"
      />
    </div>
  );
}
