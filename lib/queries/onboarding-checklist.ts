import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";

export type OnboardingChecklistStatus = {
  workspaceProfileComplete: boolean;
  signatureComplete: boolean;
  firstClientComplete: boolean;
  allComplete: boolean;
};

export async function getOnboardingChecklistStatus(): Promise<OnboardingChecklistStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return null;

  const [companyRes, userProfileRes, clientsRes] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("first_name, last_name, signature_storage_path")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId),
  ]);

  const workspaceProfileComplete = Boolean(
    companyRes.data?.company_name?.trim() &&
      userProfileRes.data?.first_name?.trim() &&
      userProfileRes.data?.last_name?.trim()
  );
  const signatureComplete = Boolean(userProfileRes.data?.signature_storage_path?.trim());
  const firstClientComplete = (clientsRes.count ?? 0) > 0;
  const allComplete = workspaceProfileComplete && signatureComplete && firstClientComplete;

  return {
    workspaceProfileComplete,
    signatureComplete,
    firstClientComplete,
    allComplete,
  };
}
