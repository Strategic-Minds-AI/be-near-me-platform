import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

// Lazy singleton: the @supabase/supabase-js package is only imported when
// Supabase is actually configured and used, so the app builds and runs even
// before the package is installed (Base44 fallback stays active).
let _client = null;
let _createClient = null;

export async function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (_client) return _client;
  if (!_createClient) {
    const mod = await import("@supabase/supabase-js");
    _createClient = mod.createClient;
  }
  _client = _createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return _client;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}