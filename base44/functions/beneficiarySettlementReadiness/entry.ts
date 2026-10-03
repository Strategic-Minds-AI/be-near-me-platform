import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin required" }, { status: 403 });

    const configs = items(await base44.asServiceRole.entities.BeneficiaryPayoutConfig.filter({ active: true }, { limit: 5 }));
    const verified = configs.find((config: any) => config.verified === true) || null;
    const readyAllocations = items(await base44.asServiceRole.entities.RevenueAllocation.filter({ settlement_state: "ready" }, { limit: 500 }));
    const pendingAllocations = items(await base44.asServiceRole.entities.RevenueAllocation.filter({ settlement_state: "pending_destination" }, { limit: 500 }));

    const readyCents = readyAllocations.reduce((sum: number, row: any) => sum + Number(row.beneficiary_pool_cents || 0), 0);
    const pendingCents = pendingAllocations.reduce((sum: number, row: any) => sum + Number(row.beneficiary_pool_cents || 0), 0);

    return Response.json({
      policy_id: "BNM-EA-REVENUE-001",
      beneficiary_pool: "Eva & Anastasia Beneficiary Pool",
      platform_share_bps: 0,
      beneficiary_pool_share_bps: 10000,
      destination_verified: !!verified,
      destination_mode: verified?.destination_mode || "unconfigured",
      ready_allocation_count: readyAllocations.length,
      ready_beneficiary_cents: readyCents,
      pending_allocation_count: pendingAllocations.length,
      pending_beneficiary_cents: pendingCents,
      settlement_execution_enabled: false,
      next_required_action: verified ? "Use protected processor settlement controls with a release receipt." : "Configure and verify a legally valid beneficiary destination.",
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Settlement readiness check failed" }, { status: 500 });
  }
}
