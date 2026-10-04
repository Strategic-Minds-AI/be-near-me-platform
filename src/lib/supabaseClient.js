import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

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
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
