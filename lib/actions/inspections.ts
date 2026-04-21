"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import type { ResultStatus } from "@/types/database";

export async function createInspection(formData: {
  title: string;
  clientId: string;
  templateId: string;
  location?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" };

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("company_name, city")
    .eq("id", formData.clientId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (clientErr || !client) {
    return { error: "Invalid client" };
  }

  const { data: template, error: tplErr } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("id", formData.templateId)
    .eq("organization_id", ctx.organizationId)
    .single();
  if (tplErr || !template) {
    return { error: "Invalid template" };
  }

  const siteParts = [client.company_name, client.city].filter(Boolean);
  const siteName = siteParts.length ? siteParts.join(" · ") : client.company_name;
  const location = formData.location?.trim() ?? "";

  const { data: inspection, error: insErr } = await supabase
    .from("inspections")
    .insert({
      user_id: user.id,
      template_id: formData.templateId,
      title: formData.title.trim(),
      client_id: formData.clientId,
      organization_id: ctx.organizationId,
      location: location || null,
      site_name: location || siteName,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (insErr || !inspection) {
    return { error: insErr?.message ?? "Failed to create inspection" };
  }

  const { data: items, error: itemsErr } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("template_id", formData.templateId)
    .order("sort_order", { ascending: true });

  if (itemsErr || !items?.length) {
    await supabase.from("inspections").delete().eq("id", inspection.id);
    return { error: "Template has no items" };
  }

  const rows = items.map((item) => ({
    inspection_id: inspection.id,
    checklist_item_id: item.id,
  }));

  const { error: resErr } = await supabase
    .from("inspection_results")
    .insert(rows);

  if (resErr) {
    await supabase.from("inspections").delete().eq("id", inspection.id);
    return { error: resErr.message };
  }

  revalidatePath("/");
  revalidatePath("/inspections");
  return { data: { id: inspection.id } };
}

export async function updateResult(formData: {
  resultId: string;
  status?: ResultStatus;
  notes?: string | null;
}) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (formData.status !== undefined) patch.status = formData.status;
  if (formData.notes !== undefined) patch.notes = formData.notes;

  const { error } = await supabase
    .from("inspection_results")
    .update(patch)
    .eq("id", formData.resultId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/inspections");
  revalidatePath("/run");
  return { ok: true };
}

export async function completeInspection(inspectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" };

  const { data: results, error: rErr } = await supabase
    .from("inspection_results")
    .select("status")
    .eq("inspection_id", inspectionId);

  if (rErr || !results?.length) {
    return { error: "Could not load results" };
  }

  const incomplete = results.some((r) => r.status == null);
  if (incomplete) {
    return { error: "Mark pass or fail for every item" };
  }

  const completeQuery = supabase
    .from("inspections")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", inspectionId)
    .eq("organization_id", ctx.organizationId);

  if (ctx.role === "technician") {
    completeQuery.eq("user_id", user.id);
  }

  const { error } = await completeQuery;

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/inspections/${inspectionId}`);
  revalidatePath("/run");
  return { ok: true };
}

export async function deleteInspection(inspectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const ctx = await getOrgContext();
  if (!ctx || ctx.role !== "admin") return { error: "Forbidden" };

  const { data: photoRows, error: photoErr } = await supabase
    .from("inspection_results")
    .select("photos(storage_path)")
    .eq("inspection_id", inspectionId);
  if (photoErr) return { error: photoErr.message };

  const storagePaths =
    photoRows
      ?.flatMap((row) =>
        (row.photos as Array<{ storage_path: string }> | null | undefined) ?? []
      )
      .map((p) => p.storage_path)
      .filter(Boolean) ?? [];

  if (storagePaths.length) {
    const { error: storageErr } = await supabase.storage
      .from("inspection-photos")
      .remove(storagePaths);
    if (storageErr) return { error: storageErr.message };
  }

  const { error } = await supabase
    .from("inspections")
    .delete()
    .eq("id", inspectionId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/inspections");
  return { ok: true };
}

export async function createTemplate(formData: {
  name: string;
  items: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" };

  const labels = formData.items.map((l) => l.trim()).filter(Boolean);
  if (!formData.name.trim() || labels.length === 0) {
    return { error: "Name and at least one checklist line required" };
  }

  const { data: template, error: tErr } = await supabase
    .from("checklist_templates")
    .insert({
      user_id: user.id,
      organization_id: ctx.organizationId,
      name: formData.name.trim(),
    })
    .select("id")
    .single();

  if (tErr || !template) {
    return { error: tErr?.message ?? "Failed to create template" };
  }

  const itemRows = labels.map((label, i) => ({
    template_id: template.id,
    label,
    sort_order: i,
  }));

  const { error: iErr } = await supabase.from("checklist_items").insert(itemRows);
  if (iErr) {
    await supabase.from("checklist_templates").delete().eq("id", template.id);
    return { error: iErr.message };
  }

  revalidatePath("/inspections/new");
  return { data: { id: template.id } };
}
