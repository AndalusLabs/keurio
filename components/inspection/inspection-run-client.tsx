"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { completeInspection, updateResult } from "@/lib/actions/inspections";
import { toast } from "@/hooks/use-toast";
import { useInspectionRunStore } from "@/store/inspection-run";
import type { InspectionStatus, ResultStatus } from "@/types/database";
import { ItemNotes } from "./item-notes";
import { ItemPhotos, type PhotoRow } from "./item-photos";
import { PassFailToggle } from "./pass-fail-toggle";

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
  items: RunItem[];
};

export function InspectionRunClient({
  inspectionId,
  title,
  inspectionStatus,
  items,
}: InspectionRunClientProps) {
  const router = useRouter();
  const activeIndex = useInspectionRunStore((s) => s.activeIndex);
  const setActiveIndex = useInspectionRunStore((s) => s.setActiveIndex);
  const next = useInspectionRunStore((s) => s.next);
  const prev = useInspectionRunStore((s) => s.prev);
  const reset = useInspectionRunStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [inspectionId, reset]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );
  const total = sorted.length;
  const current = sorted[activeIndex];
  const doneCount = sorted.filter((i) => i.status != null).length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;
  const readOnly = inspectionStatus === "completed";

  async function setStatus(status: Exclude<ResultStatus, null>) {
    if (!current || readOnly) return;
    const res = await updateResult({ resultId: current.resultId, status });
    if (res.error) {
      toast({ title: "Could not save", description: res.error, variant: "destructive" });
      return;
    }
    router.refresh();
  }

  async function onComplete() {
    const res = await completeInspection(inspectionId);
    if (res.error) {
      toast({ title: "Not ready", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Inspection complete", description: "Report is ready to download." });
    router.push(`/inspections/${inspectionId}`);
    router.refresh();
  }

  if (!current) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No checklist items.
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard" aria-label="Back">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-primary">{title}</p>
            <p className="text-xs text-muted-foreground">
              Item {activeIndex + 1} of {total}
            </p>
          </div>
          {!readOnly ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="accent" size="sm" className="shrink-0 gap-1">
                  <Flag className="h-4 w-4" />
                  Finish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete inspection?</DialogTitle>
                  <DialogDescription>
                    Every item must be marked pass or fail. You can download a PDF report
                    afterward.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" asChild>
                    <Link href={`/inspections/${inspectionId}`}>View detail</Link>
                  </Button>
                  <Button variant="accent" onClick={() => void onComplete()}>
                    Complete &amp; save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/inspections/${inspectionId}`}>Done</Link>
            </Button>
          )}
        </div>
        <div className="mx-auto mt-3 max-w-lg px-1">
          <Progress value={progress} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.resultId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col gap-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Checklist
              </p>
              <h2 className="mt-1 text-xl font-semibold leading-snug text-primary">
                {current.label}
              </h2>
            </div>
            <PassFailToggle
              value={current.status}
              onChange={setStatus}
              disabled={readOnly}
            />
            <ItemNotes
              resultId={current.resultId}
              initialNotes={current.notes}
              readOnly={readOnly}
            />
            <ItemPhotos
              resultId={current.resultId}
              photos={current.photos}
              readOnly={readOnly}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 border-t border-border/80 bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="flex-1"
            disabled={activeIndex === 0}
            onClick={() => prev()}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>
          <Button
            type="button"
            variant="default"
            size="touch"
            className="flex-1"
            disabled={activeIndex >= total - 1}
            onClick={() => next(total)}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
