import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import type { ClientRow } from "@/types";

export async function getClientsForUser(): Promise<ClientRow[]> {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("company_name", { ascending: true });

  if (error || !data) return [];
  return data as ClientRow[];
}
