"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "inspection-photos";

export async function uploadInspectionPhoto(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const resultId = formData.get("resultId") as string;
  const file = formData.get("file") as File | null;
  if (!resultId || !file?.size) {
    return { error: "Missing file or result" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${resultId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (upErr) return { error: upErr.message };

  const { error: dbErr } = await supabase.from("photos").insert({
    inspection_result_id: resultId,
    storage_path: path,
  });

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath("/");
  revalidatePath("/run");
  revalidatePath("/inspections");
  return { ok: true, path };
}

export async function deleteInspectionPhoto(photoId: string, storagePath: string) {
  const supabase = await createClient();
  const { error: dErr } = await supabase.from("photos").delete().eq("id", photoId);
  if (dErr) return { error: dErr.message };
  await supabase.storage.from(BUCKET).remove([storagePath]);
  revalidatePath("/");
  revalidatePath("/run");
  return { ok: true };
}
