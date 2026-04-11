"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/queries/org";

export type ClientFormInput = {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

function mapForm(input: ClientFormInput) {
  return {
    company_name: input.companyName.trim(),
    contact_name: input.contactName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function upsertClient(input: ClientFormInput, id?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" };

  if (!input.companyName.trim()) {
    return { error: "Company name is required" };
  }

  const payload = mapForm(input);

  if (id) {
    const { error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .eq("organization_id", ctx.organizationId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("clients").insert({
      ...payload,
      // user_id retained for audit; org_id is the tenant scope
      user_id: user.id,
      organization_id: ctx.organizationId,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/clients");
  revalidatePath("/inspections/new");
  revalidatePath("/inspections");
  return { ok: true };
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/inspections/new");
  revalidatePath("/inspections");
  return { ok: true };
}
