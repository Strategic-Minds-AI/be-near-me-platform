// ─────────────────────────────────────────────────────────────────────────
// Decoupling config — Be Near Me
// Base44 is kept ONLY for hosting + auth. Data lives in Supabase; backend
// logic runs as Vercel serverless functions. Edit the values below once your
// Supabase project and Vercel project are provisioned.
// ─────────────────────────────────────────────────────────────────────────

// Supabase project — the anon key is safe to expose to the browser; row-level
// security on your tables is what protects data.
export const SUPABASE_URL = "";      // e.g. "https://abcd.supabase.co"
export const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOi..."

// Vercel serverless functions base URL — where your /api/* routes are deployed.
export const VERCEL_API_BASE_URL = ""; // e.g. "https://benearme.vercel.app/api"

// Per-entity override: set to true to route that entity through Supabase.
// While false, calls fall back to Base44 so the app keeps working during
// migration. Flip to true once the matching Supabase table exists and is
// populated. Set SUPABASE_ENABLED_ALL=true to route every entity through
// Supabase (ignores the per-entity map).
export const SUPABASE_ENABLED_ALL = false;
export const SUPABASE_ENABLED_ENTITIES = {
  // Video: true,
  // Channel: true,
  // Comment: true,
  // Reaction: true,
  // ...add entities as you provision their tables
};

// When true, base44.functions.invoke() calls your Vercel /api/* routes
// instead of Base44 backend functions. Leave false until Vercel functions
// are deployed.
export const VERCEL_FUNCTIONS_ENABLED = false;