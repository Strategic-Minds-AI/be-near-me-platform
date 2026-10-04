import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

function requireConfigured(client) {
  if (!client) {
    const error = new Error("Native Be Near Me accounts are not connected to a dedicated Supabase project in this environment.");
    error.code = "BNM_NATIVE_AUTH_NOT_CONFIGURED";
    throw error;
  }
  return client;
}

export const nativeAuth = {
  isConfigured: isSupabaseConfigured,

  async getSession() {
    const client = requireConfigured(await getSupabase());
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  },

  async me() {
    const client = requireConfigured(await getSupabase());
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || "",
      provider: "bnm_supabase",
    };
  },

  async signUp({ email, password, fullName }) {
    const client = requireConfigured(await getSupabase());
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || "" } },
    });
    if (error) throw error;
    return data;
  },

  async signInWithPassword({ email, password }) {
    const client = requireConfigured(await getSupabase());
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async sendMagicLink(email, redirectTo) {
    const client = requireConfigured(await getSupabase());
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const client = requireConfigured(await getSupabase());
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
};
