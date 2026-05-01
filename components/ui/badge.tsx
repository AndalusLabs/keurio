import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Keurio badges — softer than stock shadcn.
 * Status variants include a tiny colored dot for scanning table rows.
 * 4.5:1 AA contrast on every color pair.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-4 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-[hsl(var(--status-fail-bg))] text-[hsl(var(--status-fail-fg))]",
        outline:
          "border-border text-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        pass:
          "border-transparent bg-[hsl(var(--status-pass-bg))] text-[hsl(var(--status-pass-fg))]",
        fail:
          "border-transparent bg-[hsl(var(--status-fail-bg))] text-[hsl(var(--status-fail-fg))]",
        warn:
          "border-transparent bg-[hsl(var(--status-warn-bg))] text-[hsl(var(--status-warn-fg))]",
        statusCompleted:
          "border-transparent bg-[hsl(var(--status-pass-bg))] text-[hsl(var(--status-pass-fg))] before:mr-0.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#1a8a3a] before:content-['']",
        statusInProgress:
          "border-transparent bg-[hsl(var(--status-warn-bg))] text-[hsl(var(--status-warn-fg))] before:mr-0.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#d9820a] before:content-['']",
        statusDraft:
          "border-transparent bg-muted text-muted-foreground before:mr-0.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#94a3b8] before:content-['']",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
