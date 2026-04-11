"use client";

import { motion } from "framer-motion";
import { ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatInspectionDateTime } from "@/lib/utils/date";
import type { InspectionListRow } from "@/types";
import type { InspectionStatus } from "@/types/database";

function statusBadge(status: InspectionStatus) {
  switch (status) {
    case "completed":
      return <Badge variant="statusCompleted">Completed</Badge>;
    case "in_progress":
      return <Badge variant="statusInProgress">In progress</Badge>;
    default:
      return <Badge variant="muted">Draft</Badge>;
  }
}

type InspectionCardsProps = {
  inspections: InspectionListRow[];
};

export function InspectionCards({ inspections }: InspectionCardsProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {inspections.map((row, i) => (
        <motion.li
          key={row.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
        >
          <Card className="overflow-hidden border-border/80 transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-primary">
                      {row.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.checklist_templates?.name ?? "Template"}
                      {row.clients?.company_name || row.site_name
                        ? ` · ${row.clients?.company_name ?? row.site_name}`
                        : null}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatInspectionDateTime(row.created_at)}
                    </p>
                  </div>
                  {statusBadge(row.status)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status !== "completed" ? (
                    <Button className="flex-1" variant="default" asChild>
                      <Link href={`/run/${row.id}`}>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <Link href={`/inspections/${row.id}`}>
                      <ClipboardList className="h-4 w-4" />
                      Detail
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.li>
      ))}
    </ul>
  );
}
