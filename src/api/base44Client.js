import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";
import { supabaseEntities } from "@/lib/db";
import { vercelInvoke } from "@/lib/vercelApi";
import {
  SUPABASE_ENABLED_ALL,
  SUPABASE_ENABLED_ENTITIES,
  VERCEL_FUNCTIONS_ENABLED,
} from "@/lib/config";

// Real Base44 SDK — used ONLY for auth, user invites, and analytics.
// Data (entities) and backend functions are routed to Supabase / Vercel.
const realBase44 = createClient({
  appId: appParams.appId,
  serverUrl: appParams.serverUrl,
  token: appParams.token,
  functionsVersion: appParams.functionsVersion,
  requiresAuth: false,
});

// Per-entity router: Supabase when enabled, else Base44 fallback.
const entitiesProxy = new Proxy(
  {},
  {
    get: (_target, name) => {
      const ent = String(name);
      const useSupabase = SUPABASE_ENABLED_ALL || SUPABASE_ENABLED_ENTITIES[ent];
      return useSupabase ? supabaseEntities[ent] : realBase44.entities[ent];
    },
  }
);

// Function invoke router: Vercel when enabled, else Base44 fallback.
async function invoke(name, payload) {
  if (VERCEL_FUNCTIONS_ENABLED) {
    const res = await vercelInvoke(name, payload);
    if (res.__fallback) return realBase44.functions.invoke(name, payload);
    return res;
  }
  return realBase44.functions.invoke(name, payload);
}

export const base44 = {
  // KEEP — Base44 auth (login, me, logout, redirectToLogin)
  auth: realBase44.auth,
  // KEEP — user invites (admin)
  users: realBase44.users,
  // KEEP — analytics (or replace later)
  analytics: realBase44.analytics,

  // REPLACE — data layer routes to Supabase per config
  entities: entitiesProxy,

  // REPLACE — backend functions route to Vercel per config
  functions: { invoke },

  // Integrations are intentionally NOT exposed. Route all AI / upload / email
  // needs through your Vercel functions (base44.functions.invoke) instead.
  integrations: new Proxy(
    {},
    {
      get: () => {
        throw new Error(
          "Base44 integrations are disabled. Call your Vercel function via base44.functions.invoke() instead."
        );
      },
    }
  ),
};