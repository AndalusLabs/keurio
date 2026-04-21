"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";
import type { WorkspaceSidebarInfo } from "@/lib/queries/org";
import type { OrganizationRole } from "@/types";
import { cn } from "@/lib/utils";

function organizationInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function roleLabel(role: OrganizationRole): "Admin" | "Technician" {
  return role === "admin" ? "Admin" : "Technician";
}

type Props = {
  workspace: WorkspaceSidebarInfo;
  email?: string | null;
  /** Logged-in user’s name (dropdown header — not the workspace title). */
  userDisplayName: string | null;
  onNavigate?: () => void;
};

export function WorkspaceSwitcher({
  workspace,
  email,
  userDisplayName,
  onNavigate,
}: Props) {
  const { organizationName, role } = workspace;
  const initials = organizationInitials(organizationName);
  const menuTitle =
    userDisplayName?.trim() ||
    email?.split("@")[0] ||
    "Account";

  return (
    <div className="px-3 pb-2 pt-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-auto min-h-9 w-full items-center justify-start gap-2 rounded-md px-3 py-1.5 text-left font-sans",
              "bg-transparent shadow-none",
              "hover:bg-muted/70 hover:text-foreground",
              "focus-visible:ring-1 focus-visible:ring-ring/40",
              "data-[state=open]:bg-muted/70"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-none text-sidebar-foreground">
              {organizationName}
            </span>
            <ChevronDown className="!h-3.5 !w-3.5 shrink-0 opacity-50" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 font-sans" sideOffset={6}>
          <div className="space-y-2 px-2 py-2">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {menuTitle}
            </p>
            <Badge
              variant="secondary"
              className="border-primary/15 bg-accent/90 font-medium text-primary shadow-none"
            >
              {roleLabel(role)}
            </Badge>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>
          <DropdownMenuItem asChild>
            <Link href="/settings/workspace" className="flex cursor-pointer items-center" onClick={onNavigate}>
              <Settings className="mr-2 h-4 w-4 text-primary" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => {
              onNavigate?.();
              void signOut();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
