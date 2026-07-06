"use client";

import { Copy, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  duplicateChecklistTemplate,
  deleteChecklistTemplate,
} from "@/lib/actions/templates";
import type { TemplateListRow } from "@/lib/queries/inspections";
import { formatInspectionDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type Props = {
  templates: TemplateListRow[];
  canAdmin: boolean;
};

export function TemplatesList({ templates, canAdmin }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDuplicate(id: string) {
    setBusyId(id);
    const res = await duplicateChecklistTemplate(id);
    setBusyId(null);
    if ("error" in res && res.error) {
      toast({ title: "Could not duplicate", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Template duplicated" });
    router.refresh();
  }

  async function onDelete(id: string) {
    setBusyId(id);
    const res = await deleteChecklistTemplate(id);
    setBusyId(null);
    if ("error" in res && res.error) {
      toast({ title: "Could not delete", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Template removed" });
    router.refresh();
  }

  if (templates.length === 0) return null;

  return (
    <ul className="space-y-3">
      {templates.map((t) => {
        const isGlobal = t.organization_id == null;
        const canUse = t.organization_id != null || t.is_system;
        const showDelete = canAdmin && !isGlobal && !t.is_system;

        return (
          <li key={t.id}>
            <Card className="border-border/80">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">{t.name}</p>
                    {t.is_default ? (
                      <span className="rounded-md border border-[#b2dbb8]/60 bg-[#b2dbb8]/35 px-2 py-0.5 text-xs font-medium text-[#0f3e18]">
                        Default
                      </span>
                    ) : null}
                    {t.standard_code === "BRL 6000-25" ? (
                      <span className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        BRL 6000-25
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGlobal && t.is_system
                      ? "Standaardtemplate (gedeeld)"
                      : isGlobal
                        ? "Library template"
                        : `Created ${formatInspectionDateTime(t.created_at)}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canUse ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/inspections/new">Use in inspection</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="opacity-60" title="Not available">
                      Use in inspection
                    </Button>
                  )}
                  {canAdmin ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      disabled={busyId === t.id}
                      onClick={() => void onDuplicate(t.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </Button>
                  ) : null}
                  {showDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn("text-muted-foreground hover:text-destructive", busyId === t.id && "opacity-50")}
                      disabled={busyId === t.id}
                      onClick={() => void onDelete(t.id)}
                      aria-label="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
