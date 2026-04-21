import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TemplatesList } from "@/components/templates/templates-list";
import { Button } from "@/components/ui/button";
import { ensureOrgDefaultTemplatesLoaded } from "@/lib/default-templates";
import { getOrgContext } from "@/lib/queries/org";
import { getTemplatesForUser } from "@/lib/queries/inspections";

export default async function TemplatesPage() {
  await ensureOrgDefaultTemplatesLoaded();
  const [templates, ctx] = await Promise.all([getTemplatesForUser(), getOrgContext()]);
  const canAdmin = ctx?.role === "admin";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Templates"
        description="Checklist templates used when you start a new inspection."
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template from the new inspection flow — use “New template” in the dialog."
          action={
            <Button variant="default" size="lg" asChild>
              <Link href="/inspections/new">
                <Plus className="h-5 w-5" />
                New Template
              </Link>
            </Button>
          }
        />
      ) : (
        <TemplatesList templates={templates} canAdmin={canAdmin ?? false} />
      )}
    </div>
  );
}
