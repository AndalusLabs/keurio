import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { OnboardingChecklistStatus } from "@/lib/queries/onboarding-checklist";
import { cn } from "@/lib/utils";

type Props = {
  status: OnboardingChecklistStatus;
  className?: string;
};

type Step = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function GetStartedChecklistCard({ status, className }: Props) {
  const steps: Step[] = [
    {
      id: "workspace-profile",
      label: "Complete your workspace profile",
      href: "/settings/workspace",
      done: status.workspaceProfileComplete,
    },
    {
      id: "signature",
      label: "Add your signature",
      href: "/settings/workspace",
      done: status.signatureComplete,
    },
    {
      id: "client",
      label: "Add your first client",
      href: "/clients",
      done: status.firstClientComplete,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-primary/15 bg-secondary p-4 text-foreground shadow-card",
        className
      )}
    >
      <div className="eyebrow !text-primary/75">GET STARTED</div>
      <p className="mt-1 text-[12px] text-primary/75">
        Complete your setup to send your first report.
      </p>

      <div className="mt-3 space-y-1.5">
        {steps.map((step) => (
          step.done ? (
            <div
              key={step.id}
              className="flex cursor-default items-center gap-2.5 rounded-lg bg-white/50 px-2.5 py-1.5 text-[12.5px] text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="line-through">{step.label}</span>
            </div>
          ) : (
            <Link
              key={step.id}
              href={step.href}
              className="flex items-center gap-2.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[12.5px] text-foreground transition-colors hover:bg-white"
            >
              <Circle className="h-4 w-4 shrink-0 text-primary" />
              <span>{step.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
}
