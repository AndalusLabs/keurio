"use client";

import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Users,
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeTone?: "default" | "warn";
};

const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/team", label: "Team", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-secondary text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
        />
      ) : null}
      <Icon
        className={cn(
          "h-[17px] w-[17px] shrink-0",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums",
            item.badgeTone === "warn"
              ? "bg-[hsl(var(--status-warn-bg))] text-[hsl(var(--status-warn-fg))]"
              : active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavSection({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-0.5">
      <div className="px-2.5 pb-1.5 eyebrow">{label}</div>
      {items.map((item) => (
        <NavRow key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </div>
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
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
        <Logo href="/dashboard" height={36} />
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
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-4 pt-3">
        <NavSection
          label="WORKSPACE"
          items={WORKSPACE_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <div className="mt-auto pt-4">
          <Link
            href="/support"
            onClick={onNavigate}
            className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LifeBuoy className="h-[17px] w-[17px]" />
            Help & support
          </Link>
        </div>
      </div>
      {workspace ? (
        <div className="border-t border-sidebar-border">
          <WorkspaceSwitcher
            workspace={workspace}
            email={email}
            userDisplayName={userDisplayName}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
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
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Logo href="/dashboard" height={30} />
      </header>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl md:hidden">
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

      <aside className="fixed left-0 top-0 z-30 hidden h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <SidebarChrome
          email={email}
          workspace={workspace}
          userDisplayName={userDisplayName}
          pathname={pathname}
        />
      </aside>

      <main className="min-h-[calc(100dvh-3.5rem)] md:min-h-dvh md:pl-64">
        <div className="mx-auto max-w-[1680px] px-6 py-6 md:px-10 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
