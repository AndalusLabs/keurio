import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";
import { getWorkspaceSignature } from "@/lib/queries/workspace";
import { renderInspectionPdfBuffer } from "@/lib/pdf/inspection-report";
import type { InspectionDetail } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getOrgContext();
  if (!user || !ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = supabase
    .from("inspections")
    .select(`
      *,
      checklist_templates ( id, name, standard_code ),
      clients ( id, company_name, city, email ),
      inspection_results (
        *,
        checklist_items ( id, label, sort_order, item_kind, section_heading ),
        photos ( * )
      )
    `)
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);
  if (ctx.role === "technician") query.eq("user_id", user.id);

  const { data, error } = await query.single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const signature = await getWorkspaceSignature();
  const buffer = await renderInspectionPdfBuffer({
    inspection: data as InspectionDetail,
    signature,
  });

  await supabase.from("inspection_pdf_downloads").insert({
    inspection_id: id,
    user_id: user.id,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspection-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
