import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Keurio card — premium SaaS surface.
 * Softer border (#eef1f5 via --border), subtle 1px shadow, 12px radius.
 * Use `interactive` for hover-raise (clickable cards).
 * Use `tone="brand" | "dark"` for accent surfaces (dashboard hero cards).
 */
const cardToneClasses = {
  default: "border bg-card text-card-foreground shadow-card",
  highlight:
    "border-primary/15 bg-secondary text-card-foreground shadow-card",
  dark:
    "border-transparent bg-gradient-to-br from-[#0f3e18] to-[#0b2e12] text-white shadow-card",
} as const;

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof cardToneClasses;
  interactive?: boolean;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = "default", interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        cardToneClasses[tone],
        interactive &&
          "transition-shadow hover:shadow-card-hover focus-within:shadow-card-hover",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-5 pb-3", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[15px] font-semibold leading-tight tracking-[-0.01em]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center border-t border-border/70 px-5 py-3",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
