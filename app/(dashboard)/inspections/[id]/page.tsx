import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InspectionSignoffCard } from "@/components/inspection/inspection-signoff-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { sendInspection, signInspection } from "@/lib/actions/inspections";
import { getInspectionDetail } from "@/lib/queries/inspections";
import { getWorkspaceSignature } from "@/lib/queries/workspace";
import { displayValueForPdf, parseItemKind } from "@/lib/inspection-item-meta";
import { formatInspectionDateTime } from "@/lib/utils/date";
import type { ResultStatus } from "@/types/database";

function resultLabel(s: ResultStatus) {
  if (s === "pass") return <Badge variant="pass">Pass</Badge>;
  if (s === "fail") return <Badge variant="fail">Fail</Badge>;
  return <Badge variant="muted">Unset</Badge>;
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInspectionDetail(id);
  if (!data) notFound();

  const templateName = data.checklist_templates?.name ?? "Template";
  const results = [...(data.inspection_results ?? [])].sort(
    (a, b) =>
      (a.checklist_items?.sort_order ?? 0) - (b.checklist_items?.sort_order ?? 0)
  );

  const workspaceSignature = await getWorkspaceSignature();
  const signoff = {
    signedAt: data.signed_at ?? null,
    sentAt: data.sent_at ?? null,
    sentToEmail: data.sent_to_email ?? null,
  };
  const clientEmail = data.clients?.email ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title={data.title}
        description={`${templateName}${data.site_name ? ` · ${data.site_name}` : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            {data.status !== "completed" ? (
              <Button variant="default" asChild>
                <Link href={`/run/${data.id}`}>Continue run</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <a href={`/api/inspections/${data.id}/pdf`} download>
                <Download className="h-4 w-4" />
                PDF report
              </a>
            </Button>
          </div>
        }
      />

      <Card className="border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">Summary</CardTitle>
          {data.status === "completed" ? (
            <Badge variant="pass">Completed</Badge>
          ) : (
            <Badge variant="secondary">In progress</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Created {formatInspectionDateTime(data.created_at)}</p>
          {data.completed_at ? (
            <p>Completed {formatInspectionDateTime(data.completed_at)}</p>
          ) : null}
        </CardContent>
      </Card>

      {data.status === "completed" ? (
        <InspectionSignoffCard
          inspectionId={data.id}
          signature={workspaceSignature}
          defaultRecipientEmail={clientEmail}
          initial={signoff}
          onSign={async () => {
            "use server";
            return signInspection(data.id);
          }}
          onSend={async (recipientEmail: string) => {
            "use server";
            return sendInspection(data.id, recipientEmail);
          }}
        />
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-primary">Checklist results</h2>
        <ul className="space-y-0 rounded-xl border border-border/80 bg-card">
          {results.map((r, idx) => {
            const kind = parseItemKind(r.checklist_items?.item_kind);
            const label = r.checklist_items?.label ?? "Item";
            const value = displayValueForPdf(
              label,
              r.notes,
              r.status as ResultStatus,
              kind,
              data.id
            );
            return (
              <li key={r.id}>
                {idx > 0 ? <Separator /> : null}
                {r.checklist_items?.section_heading ? (
                  <div className="bg-muted/60 px-4 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0f3e18]">
                      {r.checklist_items.section_heading}
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{label}</p>
                    {kind === "pass_fail" && r.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>
                    ) : null}
                    {r.photos?.length ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.photos.length} photo{r.photos.length > 1 ? "s" : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right sm:max-w-[45%]">
                    {kind === "pass_fail" ? (
                      resultLabel(r.status as ResultStatus)
                    ) : (
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Button variant="link" className="px-0 text-muted-foreground" asChild>
        <Link href="/inspections">
          <ArrowLeft className="h-4 w-4" />
          Back to inspections
        </Link>
      </Button>
    </div>
  );
}
