import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Clock, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  kind: "fail" | "completed" | "assigned" | "export" | "reminder";
  title: string;
  body: string;
  actor?: string;
  href?: string;
  timestamp: string;
  unread?: boolean;
};

const KIND = {
  fail: { icon: AlertTriangle, cls: "text-[hsl(var(--status-fail-fg))] bg-[hsl(var(--status-fail-bg))]" },
  completed: { icon: CheckCircle2, cls: "text-[hsl(var(--status-pass-fg))] bg-[hsl(var(--status-pass-bg))]" },
  assigned: { icon: FileText, cls: "text-primary bg-secondary" },
  export: { icon: Download, cls: "text-primary bg-secondary" },
  reminder: { icon: Clock, cls: "text-[hsl(var(--status-warn-fg))] bg-[hsl(var(--status-warn-bg))]" },
} as const;

const NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "fail", title: "Cold Storage check failed", body: "Bakker & Zoon · temperature exceeded threshold on aisle 3. Re-inspection required.", actor: "System", href: "/inspections", timestamp: "12 min ago", unread: true },
  { id: "n2", kind: "assigned", title: "New inspection assigned to you", body: "Fire Safety Audit · Meridian Offices · due Thursday 17:00.", actor: "Eva Visser", href: "/inspections", timestamp: "1h ago", unread: true },
  { id: "n3", kind: "completed", title: "Inspection completed", body: "Quarterly HVAC · Westfield · all 24 checks passed.", actor: "Jonas Keller", href: "/inspections", timestamp: "3h ago", unread: true },
  { id: "n4", kind: "export", title: "Report export ready", body: "March performance report (42 inspections) is ready to download.", actor: "System", href: "/reports/exports", timestamp: "Yesterday" },
  { id: "n5", kind: "reminder", title: "5 draft inspections older than 7 days", body: "Clean up stale drafts to keep your queue accurate.", href: "/inspections", timestamp: "Yesterday" },
];

export default function NotificationsPage() {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Alerts and updates from across your workspace."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
            <Button variant="outline" size="sm">
              Notification settings
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 text-[12.5px]">
        <div className="eyebrow">Inbox</div>
        {unread > 0 ? (
          <Badge variant="secondary" className="font-semibold">
            {unread} unread
          </Badge>
        ) : null}
      </div>

      {NOTIFICATIONS.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="You're all caught up"
          description="New alerts about failed inspections, completions, and assignments will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {NOTIFICATIONS.map((n) => {
                const Icon = KIND[n.kind].icon;
                const body = (
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", KIND[n.kind].cls)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-foreground">{n.title}</span>
                        {n.unread ? <span aria-label="Unread" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : null}
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{n.body}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {n.actor ? <span className="font-medium">{n.actor}</span> : null}
                        {n.actor ? <span aria-hidden>·</span> : null}
                        <span className="tabular-nums">{n.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link href={n.href} className="block transition-colors hover:bg-muted/60">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
