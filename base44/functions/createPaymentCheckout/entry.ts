import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const PRODUCT_CONFIG: Record<string, { priceEnv: string; mode: "payment" | "subscription" }> = {
  viewer_monthly: { priceEnv: "BNM_STRIPE_PRICE_VIEWER_MONTHLY", mode: "subscription" },
  viewer_annual: { priceEnv: "BNM_STRIPE_PRICE_VIEWER_ANNUAL", mode: "subscription" },
  creator_monthly: { priceEnv: "BNM_STRIPE_PRICE_CREATOR_MONTHLY", mode: "subscription" },
  creator_annual: { priceEnv: "BNM_STRIPE_PRICE_CREATOR_ANNUAL", mode: "subscription" },
  supporter: { priceEnv: "BNM_STRIPE_PRICE_SUPPORTER", mode: "payment" },
};

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

async function activeVerifiedPayoutConfig(base44: any) {
  const result = await base44.asServiceRole.entities.BeneficiaryPayoutConfig.filter({ active: true, verified: true }, { limit: 1 });
  return items(result)[0] || null;
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const productKey = String(body.product_key || "");
    const product = PRODUCT_CONFIG[productKey];
    if (!product) return Response.json({ error: "Unsupported product_key" }, { status: 400 });

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const publicAppUrl = (Deno.env.get("BNM_PUBLIC_APP_URL") || "").replace(/\/$/, "");
    if (!secretKey || !publicAppUrl) {
      return Response.json({ error: "Payments are not configured yet", code: "PAYMENTS_NOT_CONFIGURED" }, { status: 503 });
    }

    const isTestKey = secretKey.startsWith("sk_test_");
    const isLiveKey = secretKey.startsWith("sk_live_");
    if (!isTestKey && !isLiveKey) return Response.json({ error: "Invalid payment processor configuration" }, { status: 503 });

    if (isLiveKey) {
      if (Deno.env.get("BNM_LIVE_PAYMENTS_ENABLED") !== "true") {
        return Response.json({ error: "Live payments are disabled", code: "LIVE_PAYMENTS_BLOCKED" }, { status: 503 });
      }
      const payoutConfig = await activeVerifiedPayoutConfig(base44);
      if (!payoutConfig) {
        return Response.json({ error: "Live payments require a verified Eva & Anastasia beneficiary settlement destination", code: "BENEFICIARY_DESTINATION_UNVERIFIED" }, { status: 503 });
      }
    }

    const priceId = Deno.env.get(product.priceEnv) || "";
    if (!priceId) return Response.json({ error: "This payment product is not configured", code: "PRICE_NOT_CONFIGURED" }, { status: 503 });

    const form = new URLSearchParams();
    form.set("mode", product.mode);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", publicAppUrl + "/premium?payment=success&session_id={CHECKOUT_SESSION_ID}");
    form.set("cancel_url", publicAppUrl + "/premium?payment=cancelled");
    form.set("customer_email", user.email);
    form.set("client_reference_id", String(user.id || user.email));
    form.set("metadata[user_email]", user.email);
    form.set("metadata[product_key]", productKey);
    form.set("metadata[beneficiary_policy]", "BNM-EA-REVENUE-001");
    if (product.mode === "subscription") {
      form.set("subscription_data[metadata][user_email]", user.email);
      form.set("subscription_data[metadata][beneficiary_policy]", "BNM-EA-REVENUE-001");
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + secretKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": "bnm-checkout-" + String(user.id || user.email) + "-" + productKey + "-" + crypto.randomUUID(),
      },
      body: form.toString(),
    });

    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session?.url) {
      return Response.json({ error: "Could not create payment checkout", processor_error: session?.error?.message || "unknown" }, { status: 502 });
    }

    return Response.json({
      success: true,
      checkout_url: session.url,
      checkout_session_id: session.id,
      mode: isTestKey ? "test" : "live",
      beneficiary_policy: "BNM-EA-REVENUE-001",
      platform_share_bps: 0,
      beneficiary_pool_share_bps: 10000,
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Checkout creation failed" }, { status: 500 });
  }
}