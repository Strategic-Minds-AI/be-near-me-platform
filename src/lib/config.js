// Be Near Me provider convergence configuration.
// Values come from environment variables; no credential value belongs in source.
// Native consumer identity targets a dedicated Be Near Me Supabase project.
// Base44 remains a temporary compatibility provider only during migration.

export const SUPABASE_URL =
  import.meta.env.VITE_BNM_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_BNM_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const VERCEL_API_BASE_URL =
  import.meta.env.VITE_BNM_API_BASE_URL ||
  "";

export const SUPABASE_ENABLED_ALL = false;
export const SUPABASE_ENABLED_ENTITIES = {
  // Flip only after the dedicated BNM project, schema, RLS, and data migration pass.
};

export const VERCEL_FUNCTIONS_ENABLED = false;
