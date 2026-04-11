"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "profile-assets";

export async function saveCompanyProfile(values: {
  companyName: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  phone: string;
  kvkNumber: string;
  websiteUrl: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("company_profiles")
    .select("logo_storage_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = {
    user_id: user.id,
    company_name: values.companyName.trim() || null,
    address_street: values.addressStreet.trim() || null,
    address_city: values.addressCity.trim() || null,
    address_postal_code: values.addressPostalCode.trim() || null,
    phone: values.phone.trim() || null,
    kvk_number: values.kvkNumber.trim() || null,
    website_url: values.websiteUrl.trim() || null,
    logo_storage_path: existing?.logo_storage_path ?? null,
  };

  const { error } = await supabase.from("company_profiles").upsert(row, {
    onConflict: "user_id",
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function saveUserProfile(values: {
  firstName: string;
  lastName: string;
  jobTitle: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("user_profiles")
    .select("signature_storage_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = {
    user_id: user.id,
    first_name: values.firstName.trim() || null,
    last_name: values.lastName.trim() || null,
    job_title: values.jobTitle.trim() || null,
    signature_storage_path: existing?.signature_storage_path ?? null,
  };

  const { error } = await supabase.from("user_profiles").upsert(row, {
    onConflict: "user_id",
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function uploadCompanyLogo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "No file" };

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  if (!/^(png|jpe?g|gif|webp|svg)$/.test(ext)) {
    return { error: "Use PNG, JPG, GIF, WebP, or SVG" };
  }

  const path = `${user.id}/company-logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (upErr) return { error: upErr.message };

  const { data: hasRow } = await supabase
    .from("company_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const dbErr = hasRow
    ? (
        await supabase
          .from("company_profiles")
          .update({ logo_storage_path: path })
          .eq("user_id", user.id)
      ).error
    : (
        await supabase
          .from("company_profiles")
          .insert({ user_id: user.id, logo_storage_path: path })
      ).error;

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath("/settings");
  return { ok: true, path };
}

export async function uploadSignature(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { error: "No file" };

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  if (!/^(png|jpe?g|gif|webp)$/.test(ext)) {
    return { error: "Use PNG, JPG, GIF, or WebP" };
  }

  const path = `${user.id}/signature.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (upErr) return { error: upErr.message };

  const { data: hasRow } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const dbErr = hasRow
    ? (
        await supabase
          .from("user_profiles")
          .update({ signature_storage_path: path })
          .eq("user_id", user.id)
      ).error
    : (
        await supabase
          .from("user_profiles")
          .insert({ user_id: user.id, signature_storage_path: path })
      ).error;

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath("/settings");
  return { ok: true, path };
}
