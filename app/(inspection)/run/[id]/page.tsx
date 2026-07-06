import { notFound } from "next/navigation";
import {
  InspectionRunClient,
  type RunClientSummary,
  type RunItem,
} from "@/components/inspection/inspection-run-client";
import { enrichBrlRunItem, BRL_CV_STANDARD_CODE } from "@/lib/brl-cv-template-meta";
import { parseItemKind } from "@/lib/inspection-item-meta";
import { getInspectionDetail } from "@/lib/queries/inspections";
import type { ResultStatus } from "@/types/database";

function toClientSummary(
  data: NonNullable<Awaited<ReturnType<typeof getInspectionDetail>>>
): RunClientSummary | null {
  const c = data.clients;
  if (!c?.company_name?.trim()) return null;
  return {
    company_name: c.company_name.trim(),
    contact_name: c.contact_name ?? null,
    address: c.address ?? null,
    postal_code: c.postal_code ?? null,
    city: c.city ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
  };
}

function toRunItems(
  data: NonNullable<Awaited<ReturnType<typeof getInspectionDetail>>>
): RunItem[] {
  const standardCode =
    data.checklist_templates?.standard_code ??
    (data.checklist_templates?.name?.includes("BRL") ? BRL_CV_STANDARD_CODE : null);
  const results = data.inspection_results ?? [];
  return results.map((r) =>
    enrichBrlRunItem(
      {
        resultId: r.id,
        label: r.checklist_items?.label ?? "Item",
        sortOrder: r.checklist_items?.sort_order ?? 0,
        itemKind: parseItemKind(r.checklist_items?.item_kind),
        sectionHeading: r.checklist_items?.section_heading?.trim() || null,
        status: r.status as ResultStatus,
        notes: r.notes,
        photos: (r.photos ?? []).map((p) => ({
          id: p.id,
          storage_path: p.storage_path,
        })),
      },
      standardCode
    )
  );
}

export default async function RunInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInspectionDetail(id);
  if (!data) notFound();

  const items = toRunItems(data);
  const client = toClientSummary(data);
  const inspectionType =
    data.checklist_templates?.name?.trim() || "Inspection";
  const standardCode =
    data.checklist_templates?.standard_code ??
    (data.checklist_templates?.name?.includes("BRL") ? BRL_CV_STANDARD_CODE : null);

  return (
    <InspectionRunClient
      inspectionId={data.id}
      title={data.title}
      inspectionStatus={data.status}
      inspectionType={inspectionType}
      standardCode={standardCode}
      items={items}
      client={client}
    />
  );
}
