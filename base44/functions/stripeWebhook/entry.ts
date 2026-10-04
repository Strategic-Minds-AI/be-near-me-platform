import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  allocationForNetReceipt,
  assertRevenueInvariant,
  BNM_BENEFICIARY_POOL,
  BNM_REVENUE_POLICY_ID,
  computePlatformNetReceipt,
} from "../../shared/bnmRevenueLaw.ts";
import { applyPaidMembership, reverseMembershipForReceipt } from "../../shared/bnmMembershipLedger.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];
const encoder = new TextEncoder();

function hex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexBytes(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return new Uint8Array();
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function timingSafeEqualHex(a: string, b: string) {
  const aa = hexBytes(a);
  const bb = hexBytes(b);
  if (aa.length !== bb.length || aa.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const parts = header.split(",").map((x) => x.trim());
  const timestamp = parts.find((x) => x.startsWith("t="))?.slice(2) || "";
  const signatures = parts.filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  if (!timestamp || !signatures.length) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + rawBody)));
  const expected = hex(signature);
  return signatures.some((candidate) => timingSafeEqualHex(candidate, expected));
}

async function stripeGet(path: string, secret: string) {
  const response = await fetch("https://api.stripe.com/v1/" + path, {
    headers: { Authorization: "Bearer " + secret },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe read failed");
  return data;
}

async function findReceiptByEvent(base44: any, eventId: string) {
  return items(await base44.asServiceRole.entities.PaymentReceipt.filter({ processor_event_id: eventId }, { limit: 1 }))[0] || null;
}

async function findReceiptByPayment(base44: any, paymentIntentId: string) {
  return items(await base44.asServiceRole.entities.PaymentReceipt.filter({ processor_payment_id: paymentIntentId }, { limit: 1 }))[0] || null;
}

async function findAllocation(base44: any, receiptId: string) {
  return items(await base44.asServiceRole.entities.RevenueAllocation.filter({ payment_receipt_id: receiptId }, { limit: 1 }))[0] || null;
}

async function payoutReady(base44: any) {
  return !!items(await base44.asServiceRole.entities.BeneficiaryPayoutConfig.filter({ active: true, verified: true }, { limit: 1 }))[0];
}

async function rewriteAllocation(base44: any, receipt: any, netCents: number, forceReversed = false) {
  const allocationData = {
    payment_receipt_id: receipt.id,
    processor_event_id: receipt.processor_event_id,
    currency: receipt.currency || "usd",
    ...allocationForNetReceipt(netCents),
    settlement_state: forceReversed ? "reversed" : (await payoutReady(base44) ? "ready" : "pending_destination"),
  };
  assertRevenueInvariant(allocationData);
  const existing = await findAllocation(base44, receipt.id);
  if (existing) {
    await base44.asServiceRole.entities.RevenueAllocation.update(existing.id, allocationData);
    return existing.id;
  }
  const created = await base44.asServiceRole.entities.RevenueAllocation.create(allocationData);
  return created.id;
}

export default async function(req: Request) {
  const secret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  if (!secret || !webhookSecret) return Response.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("stripe-signature") || "";
  if (!(await verifyStripeSignature(rawBody, signatureHeader, webhookSecret))) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const base44 = createClientFromRequest(req);
  const existingEvent = await findReceiptByEvent(base44, event.id);
  if (existingEvent) return Response.json({ received: true, idempotent: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.metadata?.beneficiary_policy !== BNM_REVENUE_POLICY_ID) {
        return Response.json({ received: true, ignored: "unrelated checkout" });
      }
      const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntentId) {
        if (session.mode === "subscription") {
          return Response.json({ received: true, awaiting: "invoice.payment_succeeded" });
        }
        return Response.json({ error: "Missing payment intent" }, { status: 400 });
      }

      const paymentIntent = await stripeGet("payment_intents/" + encodeURIComponent(paymentIntentId) + "?expand[]=latest_charge.balance_transaction", secret);
      const balance = paymentIntent.latest_charge?.balance_transaction || {};
      const gross = Number(session.amount_total ?? paymentIntent.amount_received ?? 0);
      const fee = Number(balance.fee || 0);
      const tax = Number(session.total_details?.amount_tax || 0);
      const net = computePlatformNetReceipt({ grossAmountCents: gross, processorFeeCents: fee, taxAmountCents: tax });

      const receipt = await base44.asServiceRole.entities.PaymentReceipt.create({
        processor: "stripe",
        processor_event_id: event.id,
        processor_payment_id: paymentIntentId,
        processor_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
        processor_checkout_session_id: session.id,
        product_key: session.metadata?.product_key || "",
        user_email: session.metadata?.user_email || session.customer_details?.email || "",
        currency: session.currency || paymentIntent.currency || "usd",
        gross_amount_cents: gross,
        processor_fee_cents: fee,
        refund_amount_cents: 0,
        chargeback_amount_cents: 0,
        tax_amount_cents: tax,
        restricted_pass_through_cents: 0,
        platform_net_receipt_cents: net,
        status: "paid",
        occurred_at: new Date((event.created || Math.floor(Date.now()/1000)) * 1000).toISOString(),
        raw_event_type: event.type,
        reconciled: false,
      });
      await rewriteAllocation(base44, receipt, net);

      const tier = String(session.metadata?.membership_tier || "");
      let membershipResult: any = null;
      if (tier === "member_10" || tier === "member_20") {
        membershipResult = await applyPaidMembership(base44, {
          userEmail: receipt.user_email,
          tier,
          paymentMethod: "stripe",
          paymentReceiptId: receipt.id,
          sourceTransactionId: paymentIntentId,
        });
      }

      return Response.json({
        received: true,
        receipt_id: receipt.id,
        beneficiary_pool: BNM_BENEFICIARY_POOL,
        beneficiary_pool_cents: net,
        membership_entitlement_id: membershipResult?.entitlement?.id || null,
        infinity_coin_grant_status: membershipResult?.entitlement?.grant_status || null,
      });
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription :
        invoice.subscription?.id ||
        invoice.parent?.subscription_details?.subscription ||
        "";
      const subscription = subscriptionId ? await stripeGet("subscriptions/" + encodeURIComponent(subscriptionId), secret) : null;
      if (subscription && subscription.metadata?.beneficiary_policy !== BNM_REVENUE_POLICY_ID) {
        return Response.json({ received: true, ignored: "unrelated subscription" });
      }

      const paymentIntentId =
        typeof invoice.payment_intent === "string" ? invoice.payment_intent :
        invoice.payment_intent?.id || "";
      if (!paymentIntentId) {
        return Response.json({ received: true, pending_reconciliation: true, reason: "invoice missing payment intent" });
      }

      const paymentIntent = await stripeGet("payment_intents/" + encodeURIComponent(paymentIntentId) + "?expand[]=latest_charge.balance_transaction", secret);
      const balance = paymentIntent.latest_charge?.balance_transaction || {};
      const gross = Number(invoice.amount_paid ?? paymentIntent.amount_received ?? 0);
      const fee = Number(balance.fee || 0);
      const tax = Number(invoice.tax || 0) || (Array.isArray(invoice.total_taxes) ? invoice.total_taxes.reduce((sum: number, item: any) => sum + Number(item?.amount || 0), 0) : 0);
      const net = computePlatformNetReceipt({ grossAmountCents: gross, processorFeeCents: fee, taxAmountCents: tax });

      const receipt = await base44.asServiceRole.entities.PaymentReceipt.create({
        processor: "stripe",
        processor_event_id: event.id,
        processor_payment_id: paymentIntentId,
        processor_customer_id: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
        processor_checkout_session_id: "",
        product_key: subscription?.metadata?.product_key || "",
        user_email: subscription?.metadata?.user_email || invoice.customer_email || "",
        currency: invoice.currency || paymentIntent.currency || "usd",
        gross_amount_cents: gross,
        processor_fee_cents: fee,
        refund_amount_cents: 0,
        chargeback_amount_cents: 0,
        tax_amount_cents: tax,
        restricted_pass_through_cents: 0,
        platform_net_receipt_cents: net,
        status: "paid",
        occurred_at: new Date((event.created || Math.floor(Date.now()/1000)) * 1000).toISOString(),
        raw_event_type: event.type,
        reconciled: false,
      });
      await rewriteAllocation(base44, receipt, net);
      return Response.json({ received: true, receipt_id: receipt.id, recurring: true, beneficiary_pool: BNM_BENEFICIARY_POOL, beneficiary_pool_cents: net });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      const receipt = paymentIntentId ? await findReceiptByPayment(base44, paymentIntentId) : null;
      if (!receipt) return Response.json({ received: true, pending_reconciliation: true });
      const refund = Number(charge.amount_refunded || 0);
      const net = computePlatformNetReceipt({
        grossAmountCents: receipt.gross_amount_cents,
        processorFeeCents: receipt.processor_fee_cents,
        refundAmountCents: refund,
        chargebackAmountCents: receipt.chargeback_amount_cents,
        taxAmountCents: receipt.tax_amount_cents,
        restrictedPassThroughCents: receipt.restricted_pass_through_cents,
      });
      await base44.asServiceRole.entities.PaymentReceipt.update(receipt.id, {
        refund_amount_cents: refund,
        platform_net_receipt_cents: net,
        status: refund >= Number(receipt.gross_amount_cents || 0) ? "refunded" : "paid",
        reconciled: false,
      });
      const refreshed = { ...receipt, refund_amount_cents: refund, platform_net_receipt_cents: net };
      await rewriteAllocation(base44, refreshed, net, true);
      const membershipReversal = await reverseMembershipForReceipt(base44, receipt.id, "refund");
      return Response.json({ received: true, adjusted: "refund", beneficiary_pool_cents: net, membership_reversal: membershipReversal });
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
      const charge = chargeId ? await stripeGet("charges/" + encodeURIComponent(chargeId), secret) : null;
      const paymentIntentId = typeof charge?.payment_intent === "string" ? charge.payment_intent : charge?.payment_intent?.id;
      const receipt = paymentIntentId ? await findReceiptByPayment(base44, paymentIntentId) : null;
      if (!receipt) return Response.json({ received: true, pending_reconciliation: true });
      const disputed = Number(dispute.amount || 0);
      const net = computePlatformNetReceipt({
        grossAmountCents: receipt.gross_amount_cents,
        processorFeeCents: receipt.processor_fee_cents,
        refundAmountCents: receipt.refund_amount_cents,
        chargebackAmountCents: disputed,
        taxAmountCents: receipt.tax_amount_cents,
        restrictedPassThroughCents: receipt.restricted_pass_through_cents,
      });
      await base44.asServiceRole.entities.PaymentReceipt.update(receipt.id, {
        chargeback_amount_cents: disputed,
        platform_net_receipt_cents: net,
        status: "disputed",
        reconciled: false,
      });
      const refreshed = { ...receipt, chargeback_amount_cents: disputed, platform_net_receipt_cents: net };
      await rewriteAllocation(base44, refreshed, net, true);
      const membershipReversal = await reverseMembershipForReceipt(base44, receipt.id, "dispute");
      return Response.json({ received: true, adjusted: "dispute", beneficiary_pool_cents: net, membership_reversal: membershipReversal });
    }

    return Response.json({ received: true, ignored: event.type });
  } catch (error) {
    return Response.json({ error: error?.message || "Webhook processing failed" }, { status: 500 });
  }
}