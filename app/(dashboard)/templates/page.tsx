import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatInspectionDateTime } from "@/lib/utils/date";
import { getTemplatesForUser } from "@/lib/queries/inspections";

export default async function TemplatesPage() {
  const templates = await getTemplatesForUser();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Templates"
        description="Checklist templates used when you start a new inspection."
        action={
          <Button variant="accent" asChild>
            <Link href="/inspections/new">New template via inspection</Link>
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template from the new inspection flow — use “New template” in the dialog."
          action={
            <Button variant="accent" asChild>
              <Link href="/inspections/new">Go to new inspection</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Card className="border-border/80">
                <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-primary">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatInspectionDateTime(t.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inspections/new">Use in inspection</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
