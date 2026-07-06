import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import {
  displayValueForPdf,
  parseItemKind,
  type ChecklistItemKind,
} from "@/lib/inspection-item-meta";
import { fetchImageDataUri } from "@/lib/pdf/image-data-uri";
import type { WorkspaceSignature } from "@/lib/queries/workspace";
import { inspectionPhotoPublicUrl } from "@/lib/utils/storage";
import type { InspectionDetail } from "@/types";
import type { ResultStatus } from "@/types/database";

type Payload = {
  inspection: InspectionDetail;
  signature: WorkspaceSignature | null;
  photoDataUris: Map<string, string>;
};

type ResultRow = InspectionDetail["inspection_results"][number];

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  h1: { fontSize: 18, marginBottom: 4 },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  muted: { color: "#475569", marginBottom: 2 },
  section: { marginTop: 14, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  item: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  itemTitle: { fontSize: 11.5, marginBottom: 2 },
  badgePass: { color: "#166534" },
  badgeFail: { color: "#991b1b" },
  brlTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  brlTableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  brlColLabel: { width: "44%", fontSize: 9.5, paddingRight: 4 },
  brlColVal: { width: "26%", fontSize: 9.5 },
  brlColNotes: { width: "30%", fontSize: 8.5, color: "#64748b" },
  brlMeta: { fontSize: 9, color: "#475569", marginBottom: 10 },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  photoThumb: { width: 96, height: 72, objectFit: "cover" },
  photoCaption: { fontSize: 7.5, color: "#64748b", marginTop: 2 },
});

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(s: string | null) {
  if (s === "pass") return "PASS";
  if (s === "fail") return "FAIL";
  return "UNSET";
}

function sortedResults(inspection: InspectionDetail): ResultRow[] {
  return [...(inspection.inspection_results ?? [])].sort(
    (a, b) =>
      (a.checklist_items?.sort_order ?? 0) - (b.checklist_items?.sort_order ?? 0)
  );
}


/** Group rows by section_heading (BRL / structured templates). */
function pdfSectionBlocks(rows: ResultRow[]) {
  const blocks: { title: string | null; rows: ResultRow[] }[] = [];
  let current: { title: string | null; rows: ResultRow[] } | null = null;

  for (const r of rows) {
    const heading = r.checklist_items?.section_heading?.trim() || null;
    if (heading || !current) {
      current = { title: heading, rows: [] };
      blocks.push(current);
    }
    current.rows.push(r);
  }

  return blocks;
}

function cellValue(
  inspectionId: string,
  r: ResultRow,
  kind: ChecklistItemKind
): string {
  const label = r.checklist_items?.label ?? "";
  return displayValueForPdf(
    label,
    r.notes,
    r.status as ResultStatus,
    kind,
    inspectionId
  );
}

function notesColumn(r: ResultRow, kind: ChecklistItemKind): string {
  if (kind === "pass_fail" && r.notes?.trim()) {
    return r.notes.trim();
  }
  return "—";
}

function ResultPhotoStrip({
  photos,
  photoDataUris,
  label,
}: {
  photos: NonNullable<ResultRow["photos"]>;
  photoDataUris: Map<string, string>;
  label: string;
}) {
  const withUri = photos
    .map((p) => ({ p, uri: photoDataUris.get(p.id) }))
    .filter((x): x is { p: (typeof photos)[number]; uri: string } => Boolean(x.uri));

  if (!withUri.length) return null;

  return (
    <View style={styles.photoRow}>
      {withUri.map(({ p, uri }) => (
        <View key={p.id}>
          <PdfImage src={uri} style={styles.photoThumb} />
          <Text style={styles.photoCaption}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function BrlInspectionReportDoc({ inspection, signature, photoDataUris }: Payload) {
  const template = inspection.checklist_templates?.name ?? "Inspectie";
  const code = inspection.checklist_templates?.standard_code ?? "BRL 6000-25";
  const rows = sortedResults(inspection);
  const groups = pdfSectionBlocks(rows);
  const c = inspection.clients;

  return (
    <Document title={`${inspection.title} — ${code}`}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.h1}>{inspection.title}</Text>
        <Text style={styles.muted}>
          {template} · {code}
        </Text>
        <Text style={styles.brlMeta}>
          Locatie: {inspection.site_name ?? inspection.location ?? "—"} · Afgerond:{" "}
          {fmt(inspection.completed_at)} · Rapport: {fmt(new Date().toISOString())}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Inspectie-ID</Text>
            <Text>{inspection.id}</Text>
          </View>
          {inspection.signed_at ? (
            <View style={styles.row}>
              <Text>Digitaal ondertekend</Text>
              <Text>{fmt(inspection.signed_at)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>1. Klantgegevens</Text>
          {c?.company_name ? (
            <>
              <View style={styles.row}>
                <Text>Bedrijf</Text>
                <Text>{c.company_name}</Text>
              </View>
              {c.contact_name ? (
                <View style={styles.row}>
                  <Text>Contact</Text>
                  <Text>{c.contact_name}</Text>
                </View>
              ) : null}
              {[c.address, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).length ? (
                <View style={styles.row}>
                  <Text>Adres</Text>
                  <Text>
                    {[c.address, [c.postal_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              ) : null}
              {c.phone ? (
                <View style={styles.row}>
                  <Text>Telefoon</Text>
                  <Text>{c.phone}</Text>
                </View>
              ) : null}
              {c.email ? (
                <View style={styles.row}>
                  <Text>E-mail</Text>
                  <Text>{c.email}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.muted}>Geen client gekoppeld aan deze inspectie.</Text>
          )}
        </View>

        {groups.map((g, gi) => (
          <View key={gi}>
            {g.title ? <Text style={styles.h2}>{g.title}</Text> : null}
            <View style={styles.brlTableHeader}>
              <Text style={styles.brlColLabel}>Onderdeel</Text>
              <Text style={styles.brlColVal}>Waarde / status</Text>
              <Text style={styles.brlColNotes}>Opmerkingen</Text>
            </View>
            {g.rows.map((r) => {
              const kind = parseItemKind(r.checklist_items?.item_kind);
              const val = cellValue(inspection.id, r, kind);
              const notes = notesColumn(r, kind);
              const label = r.checklist_items?.label ?? "—";
              const photos = r.photos ?? [];
              return (
                <View key={r.id} wrap={false}>
                  <View style={styles.brlTableRow}>
                    <Text style={styles.brlColLabel}>{label}</Text>
                    <Text
                      style={[
                        styles.brlColVal,
                        ...(r.status === "pass" ? [styles.badgePass] : []),
                        ...(r.status === "fail" ? [styles.badgeFail] : []),
                      ]}
                    >
                      {val}
                    </Text>
                    <Text style={styles.brlColNotes}>{notes}</Text>
                  </View>
                  {photos.length > 0 ? (
                    <ResultPhotoStrip
                      photos={photos}
                      photoDataUris={photoDataUris}
                      label={label}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        {signature ? (
          <View style={styles.section}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
              Inspecteur (workspace)
            </Text>
            <Text>{signature.signedByName}</Text>
            <Text style={styles.muted}>{signature.signedByRole}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function InspectionReportDoc({ inspection, signature, photoDataUris }: Payload) {
  const client = inspection.clients?.company_name ?? "—";
  const template = inspection.checklist_templates?.name ?? "Template";
  const results = sortedResults(inspection);
  return (
    <Document title={`${inspection.title} - Report`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{inspection.title}</Text>
        <Text style={styles.muted}>{template}</Text>
        <Text style={styles.muted}>Client: {client}</Text>
        <Text style={styles.muted}>Completed: {fmt(inspection.completed_at)}</Text>
        <Text style={styles.muted}>Generated: {fmt(new Date().toISOString())}</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Site</Text>
            <Text>{inspection.site_name ?? inspection.location ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text>Status</Text>
            <Text>{inspection.status}</Text>
          </View>
          <View style={styles.row}>
            <Text>Inspection ID</Text>
            <Text>{inspection.id}</Text>
          </View>
          {inspection.signed_at ? (
            <View style={styles.row}>
              <Text>Signed at</Text>
              <Text>{fmt(inspection.signed_at)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={{ marginBottom: 8 }}>Checklist results</Text>
          {results.map((r) => {
            const kind = parseItemKind(r.checklist_items?.item_kind);
            const val = cellValue(inspection.id, r, kind);
            const label = r.checklist_items?.label ?? "Item";
            const photos = r.photos ?? [];
            return (
              <View key={r.id} style={styles.item}>
                <View style={styles.row}>
                  <Text style={styles.itemTitle}>{label}</Text>
                  {kind === "pass_fail" ? (
                    <Text
                      style={
                        r.status === "pass"
                          ? styles.badgePass
                          : r.status === "fail"
                            ? styles.badgeFail
                            : undefined
                      }
                    >
                      {statusLabel(r.status)}
                    </Text>
                  ) : (
                    <Text style={styles.muted}>{val}</Text>
                  )}
                </View>
                {r.notes && kind === "pass_fail" ? (
                  <Text style={styles.muted}>Notes: {r.notes}</Text>
                ) : kind === "text" && r.notes ? (
                  <Text style={styles.muted}>{r.notes}</Text>
                ) : null}
                {photos.length > 0 ? (
                  <ResultPhotoStrip
                    photos={photos}
                    photoDataUris={photoDataUris}
                    label={label}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {signature ? (
          <View style={styles.section}>
            <Text>Signed by: {signature.signedByName}</Text>
            <Text style={styles.muted}>{signature.signedByRole}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function isBrlCvTemplate(inspection: InspectionDetail): boolean {
  return inspection.checklist_templates?.standard_code === "BRL 6000-25";
}

async function resolvePhotoDataUris(
  inspection: InspectionDetail
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const r of inspection.inspection_results ?? []) {
    for (const p of r.photos ?? []) {
      const url = inspectionPhotoPublicUrl(p.storage_path);
      const uri = await fetchImageDataUri(url);
      if (uri) map.set(p.id, uri);
    }
  }
  return map;
}

export async function renderInspectionPdfBuffer(payload: {
  inspection: InspectionDetail;
  signature: WorkspaceSignature | null;
}): Promise<Buffer> {
  const photoDataUris = await resolvePhotoDataUris(payload.inspection);
  const fullPayload: Payload = { ...payload, photoDataUris };
  const doc = isBrlCvTemplate(payload.inspection) ? (
    <BrlInspectionReportDoc {...fullPayload} />
  ) : (
    <InspectionReportDoc {...fullPayload} />
  );
  const blob = await pdf(doc).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
