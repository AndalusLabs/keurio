import { createClient } from "@/lib/supabase/server";
import { profileAssetPublicUrl } from "@/lib/utils/storage";

export type WorkspaceSignature = {
  imageUrl: string;
  signedByName: string;
  signedByRole: string;
};

export async function getWorkspaceSignature(): Promise<WorkspaceSignature | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, userRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, last_name, job_title, signature_storage_path")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("users").select("full_name, email").eq("id", user.id).maybeSingle(),
  ]);

  const path = profileRes.data?.signature_storage_path?.trim() ?? "";
  if (!path) return null;

  const first = profileRes.data?.first_name?.trim() ?? "";
  const last = profileRes.data?.last_name?.trim() ?? "";
  const profileName = [first, last].filter(Boolean).join(" ").trim();
  const fallbackName = userRes.data?.full_name?.trim() || userRes.data?.email?.split("@")[0] || "Inspector";
  const role = profileRes.data?.job_title?.trim() || "Inspector";

  return {
    imageUrl: profileAssetPublicUrl(path),
    signedByName: profileName || fallbackName,
    signedByRole: role,
  };
}
