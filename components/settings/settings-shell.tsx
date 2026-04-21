"use client";

import { ArrowLeft, Building2, CreditCard, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
] as const;

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-muted/20">
      <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
          <Logo href="/dashboard" height={24} />
        </div>
        <div className="border-b border-sidebar-border px-3 py-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2 text-muted-foreground" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back to app
            </Link>
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Settings
          </p>
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:hidden">
        <header className="sticky top-0 z-20 flex h-12 items-center border-b border-border/80 bg-background/95 px-3 backdrop-blur">
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 text-muted-foreground" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar px-2 py-2">
          {SECTIONS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="min-h-dvh md:pl-56">
        <main className="px-4 py-6 md:px-10 md:py-10">
          <div className="mx-auto max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
