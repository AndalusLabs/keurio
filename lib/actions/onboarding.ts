"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { copyDefaultTemplatesToOrganization } from "@/lib/default-templates";

export async function createOrganization(formData: { name: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = formData.name.trim();
  if (!name) return { error: "Organization name is required" };

  const { data: orgId, error } = await supabase.rpc(
    "create_organization_and_admin",
    { org_name: name }
  );
  if (error || !orgId) return { error: error?.message ?? "Could not create org" };

  const copyRes = await copyDefaultTemplatesToOrganization(
    supabase,
    orgId as string,
    user.id
  );
  if ("error" in copyRes) {
    return { error: copyRes.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/inspections");
  revalidatePath("/clients");
  revalidatePath("/templates");
  redirect("/dashboard");
}

export async function finishSignupOnboarding(formData: {
  organizationName: string;
  fullName: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const organizationName = formData.organizationName.trim();
  const fullName = formData.fullName.trim();
  if (!organizationName) return { error: "Organization name is required" };
  if (!fullName) return { error: "Name is required" };

  const { error: profileError } = await supabase
    .from("users")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  const { data: orgId, error } = await supabase.rpc(
    "create_organization_and_admin",
    { org_name: organizationName }
  );
  if (error || !orgId) return { error: error?.message ?? "Could not create workspace" };

  const copyRes = await copyDefaultTemplatesToOrganization(
    supabase,
    orgId as string,
    user.id
  );
  if ("error" in copyRes) {
    return { error: copyRes.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/inspections");
  revalidatePath("/clients");
  revalidatePath("/team");
  revalidatePath("/templates");
  return { ok: true };
}

