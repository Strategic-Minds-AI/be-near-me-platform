export const BNM_MEMBERSHIP_ECONOMICS_VERSION = "BNM-MEMBERSHIP-V2-2026-10-04";

export type MembershipTier = "free" | "member_10" | "member_20";

export const BNM_MEMBERSHIP_PLANS: Record<MembershipTier, {
  tier: MembershipTier;
  priceCents: number;
  infinityCoinGrant: number;
  infinityCoinEnabled: boolean;
  paymentRequired: boolean;
  economicDecision: "APPROVED_OPERATOR_INSTRUCTION" | "INFERRED_DEFAULT_PENDING_FINAL_ECONOMIC_APPROVAL";
}> = {
  free: {
    tier: "free",
    priceCents: 0,
    infinityCoinGrant: 0,
    infinityCoinEnabled: false,
    paymentRequired: false,
    economicDecision: "APPROVED_OPERATOR_INSTRUCTION",
  },
  member_10: {
    tier: "member_10",
    priceCents: 1000,
    infinityCoinGrant: 25,
    infinityCoinEnabled: true,
    paymentRequired: true,
    economicDecision: "APPROVED_OPERATOR_INSTRUCTION",
  },
  member_20: {
    tier: "member_20",
    priceCents: 2000,
    infinityCoinGrant: 50,
    infinityCoinEnabled: true,
    paymentRequired: true,
    economicDecision: "INFERRED_DEFAULT_PENDING_FINAL_ECONOMIC_APPROVAL",
  },
};

export function membershipPlan(tier: string) {
  return BNM_MEMBERSHIP_PLANS[tier as MembershipTier] || null;
}

export function paidMembershipPlanFromProductKey(productKey: string) {
  if (productKey === "membership_10") return BNM_MEMBERSHIP_PLANS.member_10;
  if (productKey === "membership_20") return BNM_MEMBERSHIP_PLANS.member_20;
  return null;
}
