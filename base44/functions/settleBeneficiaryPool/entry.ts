import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

/**
 * BNM-EA-V1 settlement execution is intentionally disabled.
 * This endpoint reports readiness only and never initiates a processor transfer.
 */
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin required" }, { status: 403 });
    }

    const configs = items(
      await base44.asServiceRole.entities.BeneficiaryPayoutConfig.filter(
        { active: true, verified: true },
        { limit: 1 }
      )
    );
    const config = configs[0] || null;

    const body = await req.json().catch(() => ({})) || {};
    const allocationId = String(body.allocation_id || "");

    let allocation = null;
    if (allocationId) {
      allocation = await base44.asServiceRole.entities.RevenueAllocation.get(allocationId).catch(() => null);
    }

    return Response.json({
      success: false,
      execution_enabled: false,
      code: "SETTLEMENT_EXECUTION_DISABLED",
      policy_id: "BNM-EA-REVENUE-001",
      beneficiary_pool: "Eva & Anastasia Beneficiary Pool",
      platform_share_bps: 0,
      beneficiary_pool_share_bps: 10000,
      destination_verified: !!config,
      destination_mode: config?.destination_mode || "unconfigured",
      allocation_id: allocation?.id || allocationId || null,
      allocation_state: allocation?.settlement_state || null,
      beneficiary_pool_cents: allocation?.beneficiary_pool_cents ?? null,
      next_required_action: config
        ? "Use protected processor settlement controls only after an explicit release approval and settlement receipt."
        : "Configure and verify a legally valid beneficiary settlement destination first."
    }, { status: 503 });
  } catch (error) {
    return Response.json({ error: error?.message || "Settlement readiness failed" }, { status: 500 });
  }
}
