import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import type { Database } from "@/types/database";

/** Server-only: ensure org has org-scoped copies of system defaults (no-op if any org template exists). */
export async function ensureOrgDefaultTemplatesLoaded(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const ctx = await getOrgContext();
  if (!ctx) return;

  const { error } = await supabase.rpc("ensure_org_default_templates", {
    p_org_id: ctx.organizationId,
  });
  if (error) {
    console.error("[ensureOrgDefaultTemplatesLoaded]", error.message);
  }
}

/** Copy global `is_system` default templates into a new organization (signup / create org flows). */
export async function copyDefaultTemplatesToOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  _userId: string
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.rpc("ensure_org_default_templates", {
    p_org_id: organizationId,
  });
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}
