import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { BNM_MEMBERSHIP_ECONOMICS_VERSION, BNM_MEMBERSHIP_PLANS } from "../../shared/bnmMembershipPolicy.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });

    const existing = items(await base44.entities.MembershipEntitlement.filter(
      { user_email: user.email, status: "active" },
      { sort: "-created_date", limit: 10 }
    ));

    const paid = existing.find((item: any) => item.tier === "member_20" || item.tier === "member_10");
    if (paid) {
      return Response.json({ success: true, idempotent: true, entitlement: paid, preserved_paid_tier: true });
    }

    const currentFree = existing.find((item: any) => item.tier === "free");
    if (currentFree) {
      return Response.json({ success: true, idempotent: true, entitlement: currentFree });
    }

    const plan = BNM_MEMBERSHIP_PLANS.free;
    const entitlement = await base44.asServiceRole.entities.MembershipEntitlement.create({
      user_email: user.email,
      tier: plan.tier,
      status: "active",
      price_cents: plan.priceCents,
      currency: "usd",
      payment_method: "free",
      infinity_coin_enabled: false,
      infinity_coin_membership_grant: 0,
      grant_status: "none",
      economics_version: BNM_MEMBERSHIP_ECONOMICS_VERSION,
      economic_decision: plan.economicDecision,
      activated_at: new Date().toISOString(),
      description: "Free community membership; participation enabled and Infinity Coin economy disabled."
    });

    return Response.json({ success: true, entitlement });
  } catch (error) {
    return Response.json({ error: error?.message || "Could not activate free membership" }, { status: 500 });
  }
}
