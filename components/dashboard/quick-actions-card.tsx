import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileText,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dark forest-green card with the primary "Start something" action + secondary
 * shortcuts. Balances the bar chart visually in the dashboard two-column row.
 */
export function QuickActionsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-gradient-to-br from-[#0f3e18] to-[#0b2e12] p-4 text-white shadow-card",
        className
      )}
    >
      <div className="eyebrow !text-[#b2dbb8]">QUICK ACTIONS</div>
      <div className="mt-1 text-[16px] font-semibold tracking-[-0.01em]">
        Start something
      </div>

      <Link
        href="/inspections/new"
        className="group mt-3 flex items-center justify-between rounded-lg bg-white/[0.08] p-2.5 transition-colors hover:bg-white/[0.12]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#b2dbb8] text-primary">
            <Plus className="h-[17px] w-[17px]" strokeWidth={2.4} />
          </div>
          <div className="text-left">
            <div className="text-[13.5px] font-semibold">New inspection</div>
            <div className="text-[11.5px] text-[#b2dbb8]">
              Pick a template and assign
            </div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#b2dbb8] transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <SecondaryAction icon={FileText} label="Templates" href="/templates" />
        <SecondaryAction icon={Building2} label="Clients" href="/clients" />
        <SecondaryAction icon={Users} label="Team" href="/team" />
        <SecondaryAction icon={Settings} label="Settings" href="/settings" />
      </div>
    </div>
  );
}

function SecondaryAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-[12.5px] font-medium text-white/90 transition-colors hover:bg-white/[0.12] hover:text-white"
    >
      <Icon className="h-[15px] w-[15px] text-[#b2dbb8]" />
      {label}
    </Link>
  );
}
