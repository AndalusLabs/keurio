import { createClient } from "@/lib/supabase/server";

/** Display name for UI + document title: user_profiles → users.full_name → email local part. */
export async function getUserDisplayName(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, usersRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const p = profileRes.data;
  const fn = p?.first_name?.trim();
  const ln = p?.last_name?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");

  const full = usersRes.data?.full_name?.trim();
  if (full) return full;

  return user.email?.split("@")[0] ?? null;
}

export async function getUsersRow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
