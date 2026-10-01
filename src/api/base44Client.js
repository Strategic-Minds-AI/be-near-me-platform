import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

// Direct Base44 SDK client — auth, entities, functions, integrations all
// routed through Base44. (Supabase/Vercel decoupling scaffolding lives in
// src/lib/db.js, src/lib/supabaseClient.js, src/lib/vercelApi.js and
// src/lib/config.js but is not wired in here.)
export const base44 = createClient({
  appId: appParams.appId,
  serverUrl: appParams.serverUrl,
  token: appParams.token,
  functionsVersion: appParams.functionsVersion,
  requiresAuth: false,
});