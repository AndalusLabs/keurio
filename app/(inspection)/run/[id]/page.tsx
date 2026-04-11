import { notFound } from "next/navigation";
import { InspectionRunClient, type RunItem } from "@/components/inspection/inspection-run-client";
import { getInspectionDetail } from "@/lib/queries/inspections";
import type { ResultStatus } from "@/types/database";

function toRunItems(data: NonNullable<Awaited<ReturnType<typeof getInspectionDetail>>>): RunItem[] {
  const results = data.inspection_results ?? [];
  return results.map((r) => ({
    resultId: r.id,
    label: r.checklist_items?.label ?? "Item",
    sortOrder: r.checklist_items?.sort_order ?? 0,
    status: r.status as ResultStatus,
    notes: r.notes,
    photos: (r.photos ?? []).map((p) => ({
      id: p.id,
      storage_path: p.storage_path,
    })),
  }));
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

  return (
    <InspectionRunClient
      inspectionId={data.id}
      title={data.title}
      inspectionStatus={data.status}
      items={items}
    />
  );
}
