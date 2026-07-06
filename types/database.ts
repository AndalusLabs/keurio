/** Same shape as postgrest `GenericRelationship` — not imported from supabase-js (not public export in all versions). */
export type DbRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InspectionStatus = "draft" | "in_progress" | "completed";
export type ResultStatus = "pass" | "fail" | null;
export type OrganizationRole = "admin" | "technician";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      checklist_templates: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          name: string;
          created_at: string;
          is_default: boolean;
          is_system: boolean;
          standard_code: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name: string;
          created_at?: string;
          is_default?: boolean;
          is_system?: boolean;
          standard_code?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          name?: string;
          created_at?: string;
          is_default?: boolean;
          is_system?: boolean;
          standard_code?: string | null;
        };
        Relationships: DbRelationship[];
      };
      checklist_items: {
        Row: {
          id: string;
          template_id: string;
          label: string;
          sort_order: number;
          created_at: string;
          item_kind: string;
          section_heading: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          label: string;
          sort_order?: number;
          created_at?: string;
          item_kind?: string;
          section_heading?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
          item_kind?: string;
          section_heading?: string | null;
        };
        Relationships: DbRelationship[];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          company_name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          company_name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          company_name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      inspections: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          title: string;
          location: string | null;
          site_name: string | null;
          client_id: string | null;
          organization_id: string | null;
          status: InspectionStatus;
          created_at: string;
          completed_at: string | null;
          signed_at: string | null;
          sent_at: string | null;
          sent_to_email: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          title: string;
          location?: string | null;
          site_name?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          status?: InspectionStatus;
          created_at?: string;
          completed_at?: string | null;
          signed_at?: string | null;
          sent_at?: string | null;
          sent_to_email?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          title?: string;
          location?: string | null;
          site_name?: string | null;
          client_id?: string | null;
          organization_id?: string | null;
          status?: InspectionStatus;
          created_at?: string;
          completed_at?: string | null;
          signed_at?: string | null;
          sent_at?: string | null;
          sent_to_email?: string | null;
        };
        Relationships: DbRelationship[];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrganizationRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationRole;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: OrganizationRole;
          token: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: OrganizationRole;
          token: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: OrganizationRole;
          token?: string;
          created_at?: string;
          accepted_at?: string | null;
        };
        Relationships: DbRelationship[];
      };
      inspection_results: {
        Row: {
          id: string;
          inspection_id: string;
          checklist_item_id: string;
          status: ResultStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          checklist_item_id: string;
          status?: ResultStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          checklist_item_id?: string;
          status?: ResultStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: DbRelationship[];
      };
      photos: {
        Row: {
          id: string;
          inspection_result_id: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inspection_result_id: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inspection_result_id?: string;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      inspection_pdf_downloads: {
        Row: {
          id: string;
          inspection_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: DbRelationship[];
      };
      company_profiles: {
        Row: {
          user_id: string;
          company_name: string | null;
          logo_storage_path: string | null;
          address_street: string | null;
          address_city: string | null;
          address_postal_code: string | null;
          phone: string | null;
          kvk_number: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string | null;
          logo_storage_path?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_postal_code?: string | null;
          phone?: string | null;
          kvk_number?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          company_name?: string | null;
          logo_storage_path?: string | null;
          address_street?: string | null;
          address_city?: string | null;
          address_postal_code?: string | null;
          phone?: string | null;
          kvk_number?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: DbRelationship[];
      };
      user_profiles: {
        Row: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          job_title: string | null;
          signature_storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          job_title?: string | null;
          signature_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          job_title?: string | null;
          signature_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: DbRelationship[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_org_invite: {
        Args: { invite_token: string };
        Returns: string;
      };
      ensure_org_default_templates: {
        Args: { p_org_id: string };
        Returns: undefined;
      };
      peek_org_invite: {
        Args: { p_token: string };
        Returns: {
          email: string;
          accepted_at: string | null;
          organization_name: string;
        }[];
      };
    };
  };
};
