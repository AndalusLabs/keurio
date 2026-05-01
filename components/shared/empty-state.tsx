import { cn } from "@/lib/utils";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
};

/**
 * Calm, reassuring empty state for zero-data views.
 * Used by inspections list, clients, templates, notifications.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-8 py-14 text-center",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <FileQuestion className="h-5 w-5" />}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
      {(primaryLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {primaryLabel && onPrimary ? (
            <Button type="button" onClick={onPrimary}>
              {primaryLabel}
            </Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button type="button" variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
