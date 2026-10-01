import { VERCEL_API_BASE_URL, VERCEL_FUNCTIONS_ENABLED } from "@/lib/config";

// Replaces base44.functions.invoke(name, payload). Calls a Vercel serverless
// route at `${VERCEL_API_BASE_URL}/${name}` with POST + JSON. The route shape
// mirrors the old backend function: it receives the JSON body and returns JSON.
//
// When Vercel functions are not enabled, the caller falls back to Base44.
export async function vercelInvoke(name, payload = {}) {
  if (!VERCEL_FUNCTIONS_ENABLED || !VERCEL_API_BASE_URL) {
    return { __fallback: true };
  }
  const res = await fetch(`${VERCEL_API_BASE_URL}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel function ${name} failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  // Mirror the base44 invoke envelope: { data }
  return { data };
}