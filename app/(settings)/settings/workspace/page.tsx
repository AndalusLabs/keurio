import { WorkspaceSettingsClient } from "@/components/settings/workspace-settings-client";
import { getWorkspaceForSidebar } from "@/lib/queries/org";
import { getCompanyProfile, getUserProfile } from "@/lib/queries/settings";
import { getUsersRow } from "@/lib/queries/user-display";

export default async function WorkspaceSettingsPage() {
  const [initialCompany, initialUserProfile, workspace, usersRow] = await Promise.all([
    getCompanyProfile(),
    getUserProfile(),
    getWorkspaceForSidebar(),
    getUsersRow(),
  ]);

  return (
    <WorkspaceSettingsClient
      initialCompany={initialCompany}
      initialUserProfile={initialUserProfile}
      defaultOrganizationName={workspace?.organizationName}
      defaultFullName={usersRow?.full_name ?? undefined}
    />
  );
}
