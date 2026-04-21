import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TeamAdminClient } from "@/components/team/team-admin-client";
import { getOrgContext } from "@/lib/queries/org";
import { getTeamMembers } from "@/lib/queries/team";

export default async function TeamPage() {
  const ctx = await getOrgContext();
  if (!ctx) {
    return (
      <div className="space-y-10">
        <PageHeader
          title="Team"
          description="Invite colleagues and manage roles."
        />
        <EmptyState
          title="Organization setup required"
          description="Finish onboarding first to create your organization."
          action={
            <Button asChild>
              <Link href="/onboarding">Go to onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const members = (await getTeamMembers()) ?? [];
  const canManage = ctx.role === "admin";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Team"
        description={
          canManage
            ? "Invite colleagues and manage roles."
            : "People in your organization. Only admins can invite or change roles."
        }
      />
      <TeamAdminClient members={members} canManage={canManage} />
    </div>
  );
}
