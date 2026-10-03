import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { allocationForNetReceipt, assertRevenueInvariant, computePlatformNetReceipt } from "../../shared/bnmRevenueLaw.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

async function stripeGet(path: string, secret: string) {
  const response = await fetch("https://api.stripe.com/v1/" + path, { headers: { Authorization: "Bearer " + secret } });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe read failed");
  return data;
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin required" }, { status: 403 });

    const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!secretKey) return Response.json({ error: "Stripe is not configured" }, { status: 503 });

    const receipts = items(await base44.asServiceRole.entities.PaymentReceipt.filter({ reconciled: false }, { limit: 100 }));
    const results: any[] = [];

    for (const receipt of receipts) {
      if (!receipt.processor_payment_id) {
        results.push({ id: receipt.id, status: "blocked", reason: "missing processor_payment_id" });
        continue;
      }
      try {
        const paymentIntent = await stripeGet("payment_intents/" + encodeURIComponent(receipt.processor_payment_id) + "?expand[]=latest_charge.balance_transaction", secretKey);
        const balance = paymentIntent.latest_charge?.balance_transaction || {};
        const gross = Number(paymentIntent.amount_received || receipt.gross_amount_cents || 0);
        const fee = Number(balance.fee || receipt.processor_fee_cents || 0);
        const net = computePlatformNetReceipt({
          grossAmountCents: gross,
          processorFeeCents: fee,
          refundAmountCents: receipt.refund_amount_cents,
          chargebackAmountCents: receipt.chargeback_amount_cents,
          taxAmountCents: receipt.tax_amount_cents,
          restrictedPassThroughCents: receipt.restricted_pass_through_cents,
        });

        await base44.asServiceRole.entities.PaymentReceipt.update(receipt.id, {
          gross_amount_cents: gross,
          processor_fee_cents: fee,
          platform_net_receipt_cents: net,
          reconciled: true,
        });

        const allocationResult = await base44.asServiceRole.entities.RevenueAllocation.filter({ payment_receipt_id: receipt.id }, { limit: 1 });
        const allocation = items(allocationResult)[0];
        const expected = { ...allocationForNetReceipt(net) };
        assertRevenueInvariant(expected);

        if (allocation) {
          const update: any = { ...expected };
          if (allocation.settlement_state === "transferred" && Number(allocation.beneficiary_pool_cents) !== net) {
            update.settlement_state = "reversed";
          }
          await base44.asServiceRole.entities.RevenueAllocation.update(allocation.id, update);
        } else {
          await base44.asServiceRole.entities.RevenueAllocation.create({
            payment_receipt_id: receipt.id,
            processor_event_id: receipt.processor_event_id,
            currency: receipt.currency || "usd",
            ...expected,
            settlement_state: "pending_destination",
          });
        }
        results.push({ id: receipt.id, status: "reconciled", net_cents: net });
      } catch (error) {
        results.push({ id: receipt.id, status: "error", error: error?.message || String(error) });
      }
    }

    return Response.json({ checked: receipts.length, results });
  } catch (error) {
    return Response.json({ error: error?.message || "Reconciliation failed" }, { status: 500 });
  }
}
