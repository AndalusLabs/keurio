import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import type { InspectionDetail, InspectionListRow, InspectionWithTemplate } from "@/types";

export async function getInspectionsForUser(): Promise<InspectionListRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return [];

  const inspectionsQuery = supabase
    .from("inspections")
    .select(
      `
      *,
      checklist_templates ( id, name ),
      clients ( id, company_name, city )
    `
    )
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false });

  if (ctx.role === "technician") {
    inspectionsQuery.eq("user_id", user.id);
  }

  const [{ data, error }, { data: company }] = await Promise.all([
    inspectionsQuery,
    supabase
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (error || !data) return [];
  const companyName = company?.company_name?.trim() || null;
  const rows = data as unknown as InspectionWithTemplate[];
  return rows.map((row) => ({
    ...row,
    companyName,
  }));
}

export async function getInspectionDetail(
  id: string
): Promise<InspectionDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return null;

  const detailQuery = supabase
    .from("inspections")
    .select(
      `
      *,
      checklist_templates (
        *,
        checklist_items ( * )
      ),
      clients ( id, company_name, city ),
      inspection_results (
        *,
        checklist_items ( id, label, sort_order ),
        photos ( * )
      )
    `
    )
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (ctx.role === "technician") {
    detailQuery.eq("user_id", user.id);
  }

  const { data, error } = await detailQuery.single();

  if (error || !data) return null;

  const row = data as unknown as InspectionDetail;
  if (row.inspection_results?.length) {
    row.inspection_results.sort(
      (a, b) =>
        (a.checklist_items?.sort_order ?? 0) -
        (b.checklist_items?.sort_order ?? 0)
    );
  }
  return row;
}

export async function getTemplatesForUser() {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return [];

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, created_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
