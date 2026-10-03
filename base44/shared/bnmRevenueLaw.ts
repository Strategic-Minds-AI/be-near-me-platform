export const BNM_REVENUE_POLICY_ID = "BNM-EA-REVENUE-001";
export const BNM_BENEFICIARY_POOL = "Eva & Anastasia Beneficiary Pool";
export const BNM_PLATFORM_SHARE_BPS = 0;
export const BNM_BENEFICIARY_SHARE_BPS = 10000;

export function computePlatformNetReceipt(input: {
  grossAmountCents?: number;
  processorFeeCents?: number;
  refundAmountCents?: number;
  chargebackAmountCents?: number;
  taxAmountCents?: number;
  restrictedPassThroughCents?: number;
}) {
  const gross = Math.max(0, Math.trunc(Number(input.grossAmountCents || 0)));
  const processorFee = Math.max(0, Math.trunc(Number(input.processorFeeCents || 0)));
  const refunds = Math.max(0, Math.trunc(Number(input.refundAmountCents || 0)));
  const chargebacks = Math.max(0, Math.trunc(Number(input.chargebackAmountCents || 0)));
  const tax = Math.max(0, Math.trunc(Number(input.taxAmountCents || 0)));
  const passThrough = Math.max(0, Math.trunc(Number(input.restrictedPassThroughCents || 0)));
  return Math.max(0, gross - processorFee - refunds - chargebacks - tax - passThrough);
}

export function allocationForNetReceipt(netCents: number) {
  const net = Math.max(0, Math.trunc(Number(netCents || 0)));
  return {
    platform_net_receipt_cents: net,
    platform_share_bps: BNM_PLATFORM_SHARE_BPS,
    platform_share_cents: 0,
    beneficiary_pool_share_bps: BNM_BENEFICIARY_SHARE_BPS,
    beneficiary_pool_cents: net,
    beneficiary_pool_name: BNM_BENEFICIARY_POOL,
    invariant_version: BNM_REVENUE_POLICY_ID,
  };
}

export function assertRevenueInvariant(allocation: Record<string, any>) {
  if (Number(allocation.platform_share_bps) !== 0) throw new Error("BNM revenue invariant: platform share must be 0 bps");
  if (Number(allocation.platform_share_cents) !== 0) throw new Error("BNM revenue invariant: platform retained cents must be 0");
  if (Number(allocation.beneficiary_pool_share_bps) !== 10000) throw new Error("BNM revenue invariant: beneficiary pool must receive 10000 bps");
  if (Number(allocation.beneficiary_pool_cents) !== Number(allocation.platform_net_receipt_cents)) {
    throw new Error("BNM revenue invariant: 100% of platform net receipts must be assigned to Eva & Anastasia pool");
  }
}
