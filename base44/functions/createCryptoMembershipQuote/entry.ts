import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { membershipPlan } from "../../shared/bnmMembershipPolicy.ts";

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const tier = String(body.tier || "");
    const plan = membershipPlan(tier);
    if (!plan || !plan.paymentRequired) return Response.json({ error: "Unsupported membership tier" }, { status: 400 });

    const receiver = (Deno.env.get("BNM_SEPOLIA_PAYMENT_RECEIVER") || "").trim();
    const amountWei = (Deno.env.get(tier === "member_10" ? "BNM_SEPOLIA_MEMBERSHIP_10_WEI" : "BNM_SEPOLIA_MEMBERSHIP_20_WEI") || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(receiver) || !/^\d+$/.test(amountWei) || BigInt(amountWei) <= 0n) {
      return Response.json({
        error: "Sepolia crypto membership is not configured",
        code: "CRYPTO_TESTNET_NOT_CONFIGURED"
      }, { status: 503 });
    }

    return Response.json({
      success: true,
      mode: "testnet",
      network: "sepolia",
      chain_id: 11155111,
      asset: "ETH",
      receiver,
      amount_atomic: amountWei,
      membership_tier: tier,
      membership_price_usd_cents: plan.priceCents,
      infinity_coin_grant: plan.infinityCoinGrant,
      economic_decision: plan.economicDecision,
      note: "Sepolia ETH has no real-dollar settlement value. This amount exists only to validate the crypto payment workflow before mainnet approval."
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Could not create testnet quote" }, { status: 500 });
  }
}
