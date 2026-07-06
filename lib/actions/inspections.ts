"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import { getWorkspaceSignature } from "@/lib/queries/workspace";
import { renderInspectionPdfBuffer } from "@/lib/pdf/inspection-report";
import { getResend, getResendFrom } from "@/lib/email/resend";
import { isRunItemComplete, parseItemKind } from "@/lib/inspection-item-meta";
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
    .select("id, organization_id, is_system")
    .eq("id", formData.templateId)
    .maybeSingle();
  if (tplErr || !template) {
    return { error: "Invalid template" };
  }
  const templateAllowed =
    template.organization_id === ctx.organizationId ||
    (template.organization_id == null && template.is_system);
  if (!templateAllowed) {
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

  const { data: resRow, error } = await supabase
    .from("inspection_results")
    .update(patch)
    .eq("id", formData.resultId)
    .select("inspection_id")
    .maybeSingle();

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/inspections");
  revalidatePath("/run");
  if (resRow?.inspection_id) {
    revalidatePath(`/inspections/${resRow.inspection_id}`);
  }
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
    .select(
      `
      status,
      notes,
      checklist_items ( item_kind )
    `
    )
    .eq("inspection_id", inspectionId);

  if (rErr || !results?.length) {
    return { error: "Could not load results" };
  }

  const incomplete = results.some((r) => {
    const ci = r.checklist_items;
    const itemKind = parseItemKind(
      Array.isArray(ci)
        ? (ci[0] as { item_kind?: string | null } | undefined)?.item_kind
        : (ci as { item_kind?: string | null } | null)?.item_kind
    );
    return !isRunItemComplete({
      itemKind,
      status: r.status as ResultStatus,
      notes: r.notes,
    });
  });
  if (incomplete) {
    return {
      error:
        "Vul alle velden in: tekstvelden (waarde invullen) en checklist (pass/fail of ja/nee).",
    };
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
      checklist_templates ( id, name, standard_code ),
      clients ( id, company_name, contact_name, address, postal_code, city, phone, email ),
      inspection_results (
        *,
        checklist_items ( id, label, sort_order, item_kind, section_heading ),
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
  const pdfUrl = `${appUrl}/api/inspections/${id}/pdf`;
  const inspectionUrl = `${appUrl}/inspections/${id}`;
  const completedDate = inspection.completed_at
    ? new Date(inspection.completed_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const clientName = inspection.clients?.company_name ?? "Client";
  const [{ data: orgRow }, { data: companyProfile }] = await Promise.all([
    loaded.supabase
      .from("organizations")
      .select("name")
      .eq("id", inspection.organization_id)
      .maybeSingle(),
    loaded.supabase
      .from("company_profiles")
      .select("company_name")
      .eq("user_id", loaded.user.id)
      .maybeSingle(),
  ]);
  const organizationName =
    companyProfile?.company_name?.trim() ||
    orgRow?.name?.trim() ||
    "Your organization";

  try {
    const resend = getResend();
    await resend.emails.send({
      from: getResendFrom(),
      to: email,
      subject: "Your inspection report is ready",
      html: `
        <div style="margin:0; padding:24px 12px; background:#f3f4f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#0f172a;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
            <div style="padding:20px 24px; border-bottom:1px solid #f1f5f9;">
              <div style="font-size:20px; font-weight:700; color:#0f3e18; line-height:1.2;">Keurio</div>
              <div style="margin-top:4px; font-size:13px; color:#475569;">${organizationName}</div>
            </div>
            <div style="padding:24px;">
              <h1 style="margin:0 0 16px; font-size:22px; line-height:1.25; color:#0f172a;">Your inspection report is ready</h1>
              <p style="margin:0 0 8px; font-size:14px;"><strong>Client name:</strong> ${clientName}</p>
              <p style="margin:0 0 8px; font-size:14px;"><strong>Inspection name:</strong> ${inspection.title}</p>
              <p style="margin:0 0 16px; font-size:14px;"><strong>Completion date:</strong> ${completedDate}</p>
              <p style="margin:0 0 22px; font-size:14px; color:#334155;">
                Your inspector has completed the report. Click the button below to view it.
              </p>
              <a
                href="${pdfUrl}"
                style="display:inline-block; background:#0f3e18; color:#ffffff; text-decoration:none; padding:11px 16px; border-radius:8px; font-size:14px; font-weight:600;"
              >
                View report
              </a>
            </div>
            <div style="padding:14px 24px; border-top:1px solid #f1f5f9; font-size:12px; color:#64748b;">
              Sent by ${organizationName} via Keurio · keurio.app
            </div>
          </div>
          <div style="display:none; color:#f3f4f6;">${inspectionUrl}</div>
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
