import { createClient } from "@/lib/supabase/server";
import type { OrganizationMemberRow, OrganizationRole } from "@/types";

export type OrgContext = {
  organizationId: string;
  role: OrganizationRole;
};

/** Current workspace for sidebar (name from Supabase + membership role). */
export type WorkspaceSidebarInfo = {
  organizationName: string;
  role: OrganizationRole;
};

export async function getWorkspaceForSidebar(): Promise<WorkspaceSidebarInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.role) return null;

  const org = data.organizations;
  const name =
    org && typeof org === "object" && !Array.isArray(org) && "name" in org
      ? String((org as { name: string }).name).trim()
      : "";

  if (!name) return null;

  return {
    organizationName: name,
    role: data.role as OrganizationMemberRow["role"],
  };
}

export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.organization_id) return null;
  return {
    organizationId: data.organization_id,
    role: data.role as OrganizationMemberRow["role"],
  };
}

