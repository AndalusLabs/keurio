"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import { getWorkspaceSignature } from "@/lib/queries/workspace";
import { renderInspectionPdfBuffer } from "@/lib/pdf/inspection-report";
import { getResend, getResendFrom } from "@/lib/email/resend";
import type { ResultStatus } from "@/types/database";
import type { InspectionDetail } from "@/types";

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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getInspectionForWorkflow(inspectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" as const };

  const query = supabase
    .from("inspections")
    .select(`
      *,
      checklist_templates ( id, name ),
      clients ( id, company_name, city, email ),
      inspection_results (
        *,
        checklist_items ( id, label, sort_order ),
        photos ( * )
      )
    `)
    .eq("id", inspectionId)
    .eq("organization_id", ctx.organizationId);

  if (ctx.role === "technician") {
    query.eq("user_id", user.id);
  }

  const { data, error } = await query.single();
  if (error || !data) return { error: "Inspection not found" as const };
  return { supabase, user, inspection: data };
}

export async function signInspection(id: string): Promise<
  { ok: true; signedAt: string } | { ok: false; error: string }
> {
  const loaded = await getInspectionForWorkflow(id);
  if ("error" in loaded) return { ok: false, error: loaded.error ?? "Unauthorized" };

  const signature = await getWorkspaceSignature();
  if (!signature?.imageUrl) {
    return {
      ok: false,
      error: "No workspace signature found. Add one in Settings > Workspace.",
    };
  }

  const signedAt = new Date().toISOString();
  const { error } = await loaded.supabase
    .from("inspections")
    .update({ signed_at: signedAt })
    .eq("id", id)
    .eq("organization_id", loaded.inspection.organization_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/inspections/${id}`);
  revalidatePath("/inspections");
  return { ok: true, signedAt };
}

export async function sendInspection(
  id: string,
  recipientEmail: string
): Promise<{ ok: true; sentAt: string } | { ok: false; error: string }> {
  const email = recipientEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email address." };

  const loaded = await getInspectionForWorkflow(id);
  if ("error" in loaded) return { ok: false, error: loaded.error ?? "Unauthorized" };
  const inspection = loaded.inspection;

  if (inspection.status !== "completed") {
    return { ok: false, error: "Inspection must be completed before sending." };
  }
  if (!inspection.signed_at) {
    return { ok: false, error: "Inspection must be signed before sending." };
  }

  const signature = await getWorkspaceSignature();
  if (!signature?.imageUrl) {
    return {
      ok: false,
      error: "No workspace signature found. Add one in Settings > Workspace.",
    };
  }

  const pdfBuffer = await renderInspectionPdfBuffer({
    inspection: inspection as InspectionDetail,
    signature,
  });
  const path = `${loaded.user.id}/${id}/report-${Date.now()}.pdf`;
  const { error: uploadError } = await loaded.supabase.storage
    .from("inspection-reports")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) return { ok: false, error: uploadError.message };

  const expiresIn = 60 * 60 * 24 * 30;
  const { data: signed, error: signedError } = await loaded.supabase.storage
    .from("inspection-reports")
    .createSignedUrl(path, expiresIn);
  if (signedError || !signed?.signedUrl) {
    return { ok: false, error: signedError?.message ?? "Could not create report link." };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const inspectionUrl = `${appUrl}/inspections/${id}`;
  const completedDate = inspection.completed_at
    ? new Date(inspection.completed_at).toLocaleDateString("nl-NL")
    : "—";
  const clientName = inspection.clients?.company_name ?? "Client";

  try {
    const resend = getResend();
    await resend.emails.send({
      from: getResendFrom(),
      to: email,
      subject: `Inspection report: ${inspection.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">${inspection.title}</h2>
          <p style="margin: 0 0 8px;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin: 0 0 16px;"><strong>Completed:</strong> ${completedDate}</p>
          <p style="margin: 0 0 16px;">
            Your PDF report is ready. The secure link stays valid for 30 days.
          </p>
          <p style="margin: 0 0 12px;">
            <a href="${signed.signedUrl}" style="background: #0f3e18; color: #fff; padding: 10px 14px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open PDF report
            </a>
          </p>
          <p style="margin: 0; color: #475569; font-size: 13px;">
            Inspection detail: <a href="${inspectionUrl}">${inspectionUrl}</a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await loaded.supabase
    .from("inspections")
    .update({ sent_at: sentAt, sent_to_email: email })
    .eq("id", id)
    .eq("organization_id", inspection.organization_id);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/inspections/${id}`);
  revalidatePath("/inspections");
  return { ok: true, sentAt };
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

export async function deleteInspections(inspectionIds: string[]) {
  const ids = Array.from(
    new Set(inspectionIds.map((id) => id.trim()).filter(Boolean))
  );
  if (ids.length === 0) return { error: "No inspections selected" };

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
    .in("inspection_id", ids);

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
    .in("id", ids)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/inspections");
  return { ok: true, deleted: ids.length };
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
