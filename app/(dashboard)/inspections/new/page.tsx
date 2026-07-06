import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewInspectionForm } from "@/components/dashboard/new-inspection-form";
import { Button } from "@/components/ui/button";
import { ensureOrgDefaultTemplatesLoaded } from "@/lib/default-templates";
import { getClientsForUser } from "@/lib/queries/clients";
import { getTemplatesForUser } from "@/lib/queries/inspections";

export default async function NewInspectionPage() {
  await ensureOrgDefaultTemplatesLoaded();
  const [allTemplates, clients] = await Promise.all([
    getTemplatesForUser(),
    getClientsForUser(),
  ]);
  const templates = allTemplates.filter(
    (t) => t.organization_id != null || (t.organization_id == null && t.is_system)
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* Hero header — matches dashboard styling */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 w-fit gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Link href="/inspections">
            <ArrowLeft className="h-4 w-4" />
            Back to inspections
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <div className="eyebrow text-primary">START · NEW INSPECTION</div>
          <h1 className="max-w-2xl text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
            Set up a new inspection.
            <span className="font-normal text-muted-foreground">
              {" "}
              Pick a client, a template, and you&apos;re ready to go.
            </span>
          </h1>
        </div>
      </div>

      <NewInspectionForm templates={templates} clients={clients} />
    </div>
  );
}
