"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };
  const ctx = await getOrgContext();
  if (!ctx || ctx.role !== "admin") return { error: "Forbidden" as const };
  return { supabase, ctx, userId: user.id };
}

export async function duplicateChecklistTemplate(templateId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase, ctx, userId } = admin;

  const { data: src, error: fetchErr } = await supabase
    .from("checklist_templates")
    .select("id, name, organization_id, is_system, standard_code")
    .eq("id", templateId)
    .maybeSingle();

  if (fetchErr || !src) return { error: "Template not found" };

  const isGlobalSystem = src.is_system && src.organization_id == null;
  const isOwnOrg = src.organization_id === ctx.organizationId;

  if (!isGlobalSystem && !isOwnOrg) {
    return { error: "Forbidden" };
  }

  const { data: rawItems, error: itemsErr } = await supabase
    .from("checklist_items")
    .select("label, sort_order, item_kind, section_heading")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });

  if (itemsErr) return { error: itemsErr.message };

  const items = rawItems ?? [];

  const newName = isGlobalSystem ? `${src.name} (copy)` : `${src.name} (copy)`;

  const { data: created, error: insErr } = await supabase
    .from("checklist_templates")
    .insert({
      name: newName,
      organization_id: ctx.organizationId,
      user_id: userId,
      is_default: false,
      is_system: false,
      standard_code: src.standard_code ?? null,
    })
    .select("id")
    .single();

  if (insErr || !created) return { error: insErr?.message ?? "Could not duplicate" };

  if (items.length) {
    const { error: itemsErr } = await supabase.from("checklist_items").insert(
      items.map((item) => ({
        template_id: created.id,
        label: item.label,
        sort_order: item.sort_order ?? 0,
        item_kind: item.item_kind ?? "pass_fail",
        section_heading: item.section_heading ?? null,
      }))
    );
    if (itemsErr) {
      await supabase.from("checklist_templates").delete().eq("id", created.id);
      return { error: itemsErr.message };
    }
  }

  revalidatePath("/templates");
  revalidatePath("/inspections/new");
  return { ok: true as const };
}

export async function deleteChecklistTemplate(templateId: string) {
  const admin = await requireAdmin();
  if ("error" in admin) return { error: admin.error };
  const { supabase, ctx } = admin;

  const { data: row, error: fetchErr } = await supabase
    .from("checklist_templates")
    .select("id, organization_id, is_system")
    .eq("id", templateId)
    .maybeSingle();

  if (fetchErr || !row) return { error: "Template not found" };
  if (row.organization_id !== ctx.organizationId) return { error: "Forbidden" };
  if (row.is_system) return { error: "System templates cannot be deleted" };

  const { error: delErr } = await supabase.from("checklist_templates").delete().eq("id", templateId);
  if (delErr) return { error: delErr.message };

  revalidatePath("/templates");
  revalidatePath("/inspections/new");
  return { ok: true as const };
}
