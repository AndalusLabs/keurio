import { DashboardLayoutClient } from "@/components/layout/dashboard-sidebar";
import { getWorkspaceForSidebar } from "@/lib/queries/org";
import { getUserDisplayName } from "@/lib/queries/user-display";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const name = await getUserDisplayName();
  return {
    title: name ? `${name} — Keurio` : "Keurio — Field inspections",
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [workspace, userDisplayName] = await Promise.all([
    getWorkspaceForSidebar(),
    getUserDisplayName(),
  ]);

  return (
    <DashboardLayoutClient
      email={user?.email}
      workspace={workspace}
      userDisplayName={userDisplayName}
    >
      {children}
    </DashboardLayoutClient>
  );
}
