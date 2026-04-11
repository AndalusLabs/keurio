import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatInspectionDateTime } from "@/lib/utils/date";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f3e18",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  companyBlock: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f3e18",
    marginBottom: 6,
  },
  logo: {
    width: 100,
    maxHeight: 72,
    objectFit: "contain",
  },
  logoPlaceholder: {
    width: 100,
    height: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 16,
  },
  h2: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 4,
    color: "#0f3e18",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 10,
  },
  colItem: { flex: 3 },
  colStatus: { flex: 1 },
  colNotes: { flex: 3 },
  th: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#64748B",
    textTransform: "uppercase",
  },
  meta: {
    marginBottom: 16,
    fontSize: 10,
    color: "#334155",
  },
  pass: { color: "#0f3e18" },
  fail: { color: "#B91C1C" },
  techBlock: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  techName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f3e18",
  },
  techTitle: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 8,
  },
  signature: {
    height: 56,
    width: 160,
    objectFit: "contain",
    objectPosition: "left",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#94A3B8",
    textAlign: "center",
  },
});

export type ReportLine = {
  label: string;
  status: string;
  notes: string;
  photoCount: number;
};

export type ReportBranding = {
  companyName: string | null;
  companyDetailLines: string[];
  logoDataUri?: string;
  technicianName: string | null;
  technicianTitle: string | null;
  signatureDataUri?: string;
};

type InspectionReportPdfProps = {
  title: string;
  siteName: string | null;
  templateName: string;
  completedAt: string | null;
  createdAt: string;
  lines: ReportLine[];
  branding?: ReportBranding | null;
};

export function InspectionReportPdf({
  title,
  siteName,
  templateName,
  completedAt,
  createdAt,
  lines,
  branding,
}: InspectionReportPdfProps) {
  const when = completedAt ?? createdAt;
  const displayCompanyName =
    branding?.companyName?.trim() || "Keurio";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow} fixed>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{displayCompanyName}</Text>
            {(branding?.companyDetailLines ?? []).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
          <View>
            {branding?.logoDataUri ? (
              <Image src={branding.logoDataUri} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
          </View>
        </View>

        <Text style={styles.subtitle}>Field inspection report</Text>
        <Text style={styles.h2}>{title}</Text>
        <View style={styles.meta}>
          <Text>Template: {templateName}</Text>
          {siteName ? <Text>Site: {siteName}</Text> : null}
          <Text>Date: {formatInspectionDateTime(when)}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 2 }]}>
          <Text style={[styles.colItem, styles.th]}>Checklist item</Text>
          <Text style={[styles.colStatus, styles.th]}>Result</Text>
          <Text style={[styles.colNotes, styles.th]}>Notes / photos</Text>
        </View>
        {lines.map((line, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.colItem}>{line.label}</Text>
            <Text
              style={[
                styles.colStatus,
                line.status === "Pass" ? styles.pass : styles.fail,
              ]}
            >
              {line.status}
            </Text>
            <Text style={styles.colNotes}>
              {line.notes || "—"}
              {line.photoCount > 0
                ? `  (${line.photoCount} photo${line.photoCount > 1 ? "s" : ""})`
                : ""}
            </Text>
          </View>
        ))}

        {branding?.technicianName || branding?.technicianTitle || branding?.signatureDataUri ? (
          <View style={styles.techBlock} wrap={false}>
            {branding.technicianName ? (
              <Text style={styles.techName}>{branding.technicianName}</Text>
            ) : null}
            {branding.technicianTitle ? (
              <Text style={styles.techTitle}>{branding.technicianTitle}</Text>
            ) : null}
            {branding.signatureDataUri ? (
              <Image src={branding.signatureDataUri} style={styles.signature} />
            ) : null}
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Generated by Keurio — keurio.app
        </Text>
      </Page>
    </Document>
  );
}
