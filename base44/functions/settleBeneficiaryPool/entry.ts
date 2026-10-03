import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { assertRevenueInvariant } from "../../shared/bnmRevenueLaw.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin required" }, { status: 403 });

    if (Deno.env.get("BNM_LIVE_PAYOUTS_ENABLED") !== "true") {
      return Response.json({ error: "Live beneficiary payouts are disabled", code: "LIVE_PAYOUTS_BLOCKED" }, { status: 503 });
    }

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!secretKey.startsWith("sk_live_")) {
      return Response.json({ error: "A live Stripe key is required for live settlement" }, { status: 503 });
    }

    const configs = items(await base44.asServiceRole.entities.BeneficiaryPayoutConfig.filter({ active: true, verified: true }, { limit: 1 }));
    const config = configs[0];
    if (!config) return Response.json({ error: "No verified active Eva & Anastasia beneficiary destination" }, { status: 409 });
    if (config.destination_mode !== "single_legal_destination" || !config.destination_reference) {
      return Response.json({ error: "This settlement function requires one verified legal beneficiary-pool destination" }, { status: 409 });
    }

    const body = await req.json().catch(() => ({})) || {};
    const allocationId = String(body.allocation_id || "");
    if (!allocationId) return Response.json({ error: "allocation_id required" }, { status: 400 });

    const allocation = await base44.asServiceRole.entities.RevenueAllocation.get(allocationId);
    if (!allocation) return Response.json({ error: "Allocation not found" }, { status: 404 });

    assertRevenueInvariant(allocation);
    if (allocation.settlement_state === "transferred") {
      return Response.json({ success: true, idempotent: true, transfer_id: allocation.processor_transfer_id });
    }
    if (allocation.settlement_state !== "ready") {
      return Response.json({ error: "Allocation is not ready for settlement", state: allocation.settlement_state }, { status: 409 });
    }

    const amount = Math.max(0, Math.trunc(Number(allocation.beneficiary_pool_cents || 0)));
    if (!amount) return Response.json({ error: "No beneficiary amount to settle" }, { status: 409 });

    const form = new URLSearchParams();
    form.set("amount", String(amount));
    form.set("currency", String(allocation.currency || "usd").toLowerCase());
    form.set("destination", String(config.destination_reference));
    form.set("metadata[policy_id]", "BNM-EA-REVENUE-001");
    form.set("metadata[beneficiary_pool]", "Eva & Anastasia Beneficiary Pool");
    form.set("metadata[allocation_id]", allocation.id);

    const stripeResponse = await fetch("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": "bnm-ea-allocation-" + allocation.id,
      },
      body: form.toString(),
    });
    const transfer = await stripeResponse.json();
    if (!stripeResponse.ok || !transfer?.id) {
      return Response.json({ error: "Processor transfer failed", processor_error: transfer?.error?.message || "unknown" }, { status: 502 });
    }

    await base44.asServiceRole.entities.RevenueAllocation.update(allocation.id, {
      settlement_state: "transferred",
      processor_transfer_id: transfer.id,
      settled_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      transfer_id: transfer.id,
      beneficiary_pool_cents: amount,
      beneficiary_pool: "Eva & Anastasia Beneficiary Pool",
      platform_share_cents: 0,
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Settlement failed" }, { status: 500 });
  }
}
