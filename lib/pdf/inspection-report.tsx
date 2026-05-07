import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { InspectionDetail } from "@/types";
import type { WorkspaceSignature } from "@/lib/queries/workspace";

type Payload = {
  inspection: InspectionDetail;
  signature: WorkspaceSignature | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  h1: { fontSize: 18, marginBottom: 4 },
  muted: { color: "#475569", marginBottom: 2 },
  section: { marginTop: 14, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  item: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  itemTitle: { fontSize: 11.5, marginBottom: 2 },
  badgePass: { color: "#166534" },
  badgeFail: { color: "#991b1b" },
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

function InspectionReportDoc({ inspection, signature }: Payload) {
  const client = inspection.clients?.company_name ?? "—";
  const template = inspection.checklist_templates?.name ?? "Template";
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
          {inspection.inspection_results.map((r) => (
            <View key={r.id} style={styles.item}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{r.checklist_items?.label ?? "Item"}</Text>
                <Text style={r.status === "pass" ? styles.badgePass : r.status === "fail" ? styles.badgeFail : undefined}>
                  {statusLabel(r.status)}
                </Text>
              </View>
              {r.notes ? <Text style={styles.muted}>Notes: {r.notes}</Text> : null}
              <Text style={styles.muted}>Photos: {r.photos?.length ?? 0}</Text>
            </View>
          ))}
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

export async function renderInspectionPdfBuffer(payload: Payload): Promise<Buffer> {
  const blob = await pdf(<InspectionReportDoc {...payload} />).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
