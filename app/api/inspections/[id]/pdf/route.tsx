import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import {
  InspectionReportPdf,
  type ReportBranding,
} from "@/components/pdf/inspection-report";
import { fetchImageDataUri } from "@/lib/pdf/image-data-uri";
import { createClient } from "@/lib/supabase/server";
import { profileAssetPublicUrl } from "@/lib/utils/storage";
import type { InspectionDetail } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("inspections")
    .select(
      `
      *,
      checklist_templates ( id, name ),
      inspection_results (
        *,
        checklist_items ( id, label, sort_order ),
        photos ( id )
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = data as unknown as InspectionDetail;
  const templateName = row.checklist_templates?.name ?? "Template";
  const results = [...(row.inspection_results ?? [])].sort(
    (a, b) =>
      (a.checklist_items?.sort_order ?? 0) -
      (b.checklist_items?.sort_order ?? 0)
  );

  const lines = results.map((r) => ({
    label: r.checklist_items?.label ?? "Item",
    status:
      r.status === "pass" ? "Pass" : r.status === "fail" ? "Fail" : "Pending",
    notes: r.notes?.trim() || "",
    photoCount: r.photos?.length ?? 0,
  }));

  const [{ data: company }, { data: userProfile }] = await Promise.all([
    supabase.from("company_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const companyDetailLines: string[] = [];
  if (company?.address_street?.trim()) {
    companyDetailLines.push(company.address_street.trim());
  }
  const cityLine = [company?.address_postal_code, company?.address_city]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (cityLine) companyDetailLines.push(cityLine);
  if (company?.phone?.trim()) {
    companyDetailLines.push(`Tel: ${company.phone.trim()}`);
  }
  if (company?.kvk_number?.trim()) {
    companyDetailLines.push(`KVK: ${company.kvk_number.trim()}`);
  }
  if (company?.website_url?.trim()) {
    companyDetailLines.push(company.website_url.trim());
  }

  const logoUrl = company?.logo_storage_path
    ? profileAssetPublicUrl(company.logo_storage_path)
    : "";
  const sigUrl = userProfile?.signature_storage_path
    ? profileAssetPublicUrl(userProfile.signature_storage_path)
    : "";

  const [logoDataUri, signatureDataUri] = await Promise.all([
    fetchImageDataUri(logoUrl),
    fetchImageDataUri(sigUrl),
  ]);

  const techFirst = userProfile?.first_name?.trim() ?? "";
  const techLast = userProfile?.last_name?.trim() ?? "";
  const technicianName =
    [techFirst, techLast].filter(Boolean).join(" ") || null;

  const branding: ReportBranding = {
    companyName: company?.company_name?.trim() || null,
    companyDetailLines,
    logoDataUri,
    technicianName,
    technicianTitle: userProfile?.job_title?.trim() || null,
    signatureDataUri,
  };

  const doc = (
    <InspectionReportPdf
      title={row.title}
      siteName={row.site_name}
      templateName={templateName}
      completedAt={row.completed_at}
      createdAt={row.created_at}
      lines={lines}
      branding={branding}
    />
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error: logError } = await supabase.from("inspection_pdf_downloads").insert({
    inspection_id: id,
    user_id: user.id,
  });
  if (logError) {
    console.error("[pdf] inspection_pdf_downloads insert:", logError.message);
  }

  const filename = `keurio-report-${id.slice(0, 8)}.pdf`;
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
