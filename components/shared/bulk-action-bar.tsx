"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BulkAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * Sticky bulk-action bar that floats at the bottom of a data table when rows
 * are selected. Used by inspections, clients, team, templates.
 *
 * Usage:
 *   <BulkActionBar
 *     count={selected}
 *     total={filtered}
 *     entity="inspection"
 *     actions={[...]}
 *     onClear={() => table.resetRowSelection()}
 *   />
 */
export function BulkActionBar({
  count,
  total,
  entity,
  entityPlural,
  actions,
  onClear,
  className,
}: {
  count: number;
  total?: number;
  entity: string;
  /** When set, used when more than one row is selected instead of appending "s" to `entity`. */
  entityPlural?: string;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}) {
  const visible = count > 0;
  const noun =
    count === 1 ? entity : (entityPlural ?? `${entity}s`);
  return (
    <div
      role="toolbar"
      aria-label={`${count} ${noun} selected`}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        className
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-popover px-2 py-1.5 shadow-card-hover">
        <div className="flex items-center gap-2 pl-2 pr-1 text-[12.5px] font-medium text-foreground">
          <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
            {count}
          </span>
          <span className="text-muted-foreground">
            {noun} selected
            {total != null ? (
              <span className="ml-1 text-muted-foreground/70">of {total}</span>
            ) : null}
          </span>
        </div>
        <span aria-hidden className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.label}
                type="button"
                size="sm"
                variant={a.variant ?? "ghost"}
                onClick={a.onClick}
                className="h-8 gap-1.5"
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {a.label}
              </Button>
            );
          })}
        </div>
        <span aria-hidden className="h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Clear selection"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
