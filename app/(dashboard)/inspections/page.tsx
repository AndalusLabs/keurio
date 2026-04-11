import { Plus } from "lucide-react";
import Link from "next/link";
import { InspectionsDataTable } from "@/components/dashboard/inspections-data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getInspectionsForUser } from "@/lib/queries/inspections";

export default async function InspectionsListPage() {
  const inspections = await getInspectionsForUser();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Inspections"
        description="Open a run in the field, then generate a PDF report when you are done."
        action={
          <Button variant="default" size="lg" asChild>
            <Link href="/inspections/new">
              <Plus className="h-5 w-5" />
              New inspection
            </Link>
          </Button>
        }
      />

      {inspections.length === 0 ? (
        <EmptyState
          title="No inspections yet"
          description="Create your first inspection, pick a checklist template, and start capturing results on site."
          action={
            <Button variant="default" asChild>
              <Link href="/inspections/new">Create inspection</Link>
            </Button>
          }
        />
      ) : (
        <InspectionsDataTable data={inspections} />
      )}
    </div>
  );
}
