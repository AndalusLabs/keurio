"use client";

import { ChevronLeft, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { completeInspection, updateResult } from "@/lib/actions/inspections";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { InspectionStatus, ResultStatus } from "@/types/database";
import { InspectionRunItemCard } from "./inspection-run-item-card";
import type { PhotoRow } from "./item-photos";

export type RunItem = {
  resultId: string;
  label: string;
  sortOrder: number;
  status: ResultStatus;
  notes: string | null;
  photos: PhotoRow[];
};

type InspectionRunClientProps = {
  inspectionId: string;
  title: string;
  inspectionStatus: InspectionStatus;
  inspectionType: string;
  items: RunItem[];
};

function findNextIncompleteId(sorted: RunItem[], afterResultId: string): string | null {
  const idx = sorted.findIndex((i) => i.resultId === afterResultId);
  if (idx === -1) return null;
  for (let i = idx + 1; i < sorted.length; i++) {
    if (sorted[i].status == null) return sorted[i].resultId;
  }
  for (let i = 0; i < idx; i++) {
    if (sorted[i].status == null) return sorted[i].resultId;
  }
  return null;
}

export function InspectionRunClient({
  inspectionId,
  title,
  inspectionStatus,
  inspectionType,
  items,
}: InspectionRunClientProps) {
  const router = useRouter();
  const scrollToResultIdRef = useRef<string | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const total = sorted.length;
  const doneCount = sorted.filter((i) => i.status != null).length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  const readOnly = inspectionStatus === "completed";
  const allComplete = total > 0 && doneCount === total;

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
      toast({
        title: "Could not save",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    const nextId = findNextIncompleteId(sorted, resultId);
    if (nextId) {
      scrollToResultIdRef.current = nextId;
    }
    router.refresh();
  }

  async function onFinish() {
    if (readOnly) return;
    if (!allComplete) {
      toast({
        description: "Please complete all checklist items first",
        variant: "destructive",
      });
      return;
    }
    const res = await completeInspection(inspectionId);
    if (res.error) {
      toast({
        title: "Not ready",
        description: res.error,
        variant: "destructive",
      });
      return;
    }
    toast({ description: "Inspection completed!" });
    router.push(`/inspections/${inspectionId}`);
    router.refresh();
  }

  if (!total) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No checklist items.
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] shrink-0" asChild>
            <Link href="/dashboard" aria-label="Back">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 px-1 text-center">
            <p className="truncate text-base font-semibold text-[#0f3e18]">{title}</p>
            <p className="text-sm text-muted-foreground">
              {doneCount} / {total} items completed
            </p>
          </div>
          {!readOnly ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              className={cn(
                "min-h-[44px] shrink-0 gap-1 px-3",
                !allComplete && "opacity-50"
              )}
              onClick={() => void onFinish()}
            >
              <Flag className="h-4 w-4" />
              Finish
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="min-h-[44px] shrink-0" asChild>
              <Link href={`/inspections/${inspectionId}`}>Done</Link>
            </Button>
          )}
        </div>
        <div className="mx-auto mt-3 max-w-lg px-1">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-[max(5rem,env(safe-area-inset-bottom,0px))] pt-4">
        <Card className="overflow-hidden border-border/80">
          {sorted.map((item, i) => (
            <InspectionRunItemCard
              key={item.resultId}
              item={item}
              displayIndex={i + 1}
              inspectionType={inspectionType}
              readOnly={readOnly}
              isLast={i === sorted.length - 1}
              onSetStatus={onSetStatus}
            />
          ))}
        </Card>
      </main>
    </div>
  );
}
