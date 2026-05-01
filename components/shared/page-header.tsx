import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  action?: React.ReactNode;
};

/**
 * Standard page header — eyebrow + title + description + optional action slot.
 * Slimmer than the dashboard hero; used on inspections/clients/templates/etc.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  className,
  action,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="eyebrow text-primary">{eyebrow}</div>
        ) : null}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
