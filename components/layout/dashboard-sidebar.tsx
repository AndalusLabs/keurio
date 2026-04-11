"use client";

import {
  Home,
  LayoutDashboard,
  List,
  Menu,
  Users,
  Users2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Button } from "@/components/ui/button";
import type { WorkspaceSidebarInfo } from "@/lib/queries/org";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspections", label: "Inspections", icon: Home },
  { href: "/clients", label: "Clients", icon: Users2 },
  { href: "/templates", label: "Templates", icon: List },
  { href: "/team", label: "Team", icon: Users },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarChrome({
  email,
  workspace,
  userDisplayName,
  pathname,
  onNavigate,
  showClose,
  onClose,
}: {
  email?: string | null;
  workspace: WorkspaceSidebarInfo | null;
  userDisplayName: string | null;
  pathname: string;
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 px-4">
        <Logo href="/dashboard" height={26} />
        {showClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
      {workspace ? (
        <WorkspaceSwitcher
          workspace={workspace}
          email={email}
          userDisplayName={userDisplayName}
          onNavigate={onNavigate}
        />
      ) : null}
      <NavLinks pathname={pathname} onNavigate={onNavigate} />
    </>
  );
}

export function DashboardLayoutClient({
  children,
  email,
  workspace,
  userDisplayName,
}: {
  children: React.ReactNode;
  email?: string | null;
  workspace: WorkspaceSidebarInfo | null;
  userDisplayName: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Logo href="/dashboard" height={24} />
      </header>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-border/80 bg-card shadow-xl md:hidden">
            <SidebarChrome
              email={email}
              workspace={workspace}
              userDisplayName={userDisplayName}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              showClose
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 border-r border-border/80 bg-card md:flex md:flex-col">
        <SidebarChrome
          email={email}
          workspace={workspace}
          userDisplayName={userDisplayName}
          pathname={pathname}
        />
      </aside>

      <main className="min-h-[calc(100dvh-3.5rem)] md:min-h-dvh md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
