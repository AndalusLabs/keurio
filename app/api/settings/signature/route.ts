import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "profile-assets";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  if (!/^(png|jpe?g|gif|webp)$/.test(ext)) {
    return NextResponse.json(
      { error: "Use PNG, JPG, GIF, or WebP" },
      { status: 400 }
    );
  }

  const path = `${user.id}/signature.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/png",
    upsert: true,
  });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

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
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
