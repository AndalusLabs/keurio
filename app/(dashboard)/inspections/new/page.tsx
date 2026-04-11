import Link from "next/link";
import { NewInspectionForm } from "@/components/dashboard/new-inspection-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getClientsForUser } from "@/lib/queries/clients";
import { getTemplatesForUser } from "@/lib/queries/inspections";

export default async function NewInspectionPage() {
  const [templates, clients] = await Promise.all([
    getTemplatesForUser(),
    getClientsForUser(),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <PageHeader
        title="New inspection"
        description="Choose a checklist template and give this site visit a clear title."
        action={
          <Button variant="ghost" asChild>
            <Link href="/inspections">Cancel</Link>
          </Button>
        }
      />
      <NewInspectionForm templates={templates} clients={clients} />
    </div>
  );
}
