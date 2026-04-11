function missingSupabaseEnvMessage() {
  return (
    "Supabase-omgeving ontbreekt. Maak in de projectroot een bestand .env.local aan " +
    "(kopieer .env.example) en zet NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Dashboard: Project Settings → API."
  );
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) {
    throw new Error(missingSupabaseEnvMessage());
  }
  return { url, anonKey };
}
