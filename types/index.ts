import type {
  Database,
  InspectionStatus,
  OrganizationRole,
  ResultStatus,
} from "./database";

export type { Database, InspectionStatus, OrganizationRole, ResultStatus };

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type ChecklistTemplateRow =
  Database["public"]["Tables"]["checklist_templates"]["Row"];
export type ChecklistItemRow =
  Database["public"]["Tables"]["checklist_items"]["Row"];
export type InspectionRow = Database["public"]["Tables"]["inspections"]["Row"];
export type InspectionResultRow =
  Database["public"]["Tables"]["inspection_results"]["Row"];
export type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMemberRow =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type OrganizationInviteRow =
  Database["public"]["Tables"]["organization_invites"]["Row"];
export type CompanyProfileRow =
  Database["public"]["Tables"]["company_profiles"]["Row"];
export type UserProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

export type InspectionWithTemplate = InspectionRow & {
  checklist_templates: Pick<ChecklistTemplateRow, "id" | "name"> | null;
  clients?: Pick<ClientRow, "id" | "company_name" | "city"> | null;
};

/** List/table row: inspections query attaches company name from settings. */
export type InspectionListRow = InspectionWithTemplate & {
  companyName: string | null;
};

export type InspectionDetail = InspectionRow & {
  checklist_templates: (ChecklistTemplateRow & {
    checklist_items: ChecklistItemRow[];
  }) | null;
  clients?: Pick<ClientRow, "id" | "company_name" | "city"> | null;
  inspection_results: (InspectionResultRow & {
    checklist_items: Pick<ChecklistItemRow, "id" | "label" | "sort_order">;
    photos: PhotoRow[];
  })[];
};
