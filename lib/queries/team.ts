import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";

export type TeamMember = {
  memberId: string;
  userId: string;
  role: "admin" | "technician";
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export async function getTeamMembers(): Promise<TeamMember[] | null> {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return null;

  const { data: members, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: true });

  if (error || !members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { email: p.email, fullName: p.full_name }])
  );

  return members.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      memberId: row.id,
      userId: row.user_id,
      role: row.role as "admin" | "technician",
      createdAt: row.created_at,
      email: profile?.email ?? null,
      fullName: profile?.fullName ?? null,
    };
  });
}

