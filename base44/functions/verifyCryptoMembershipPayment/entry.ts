import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { applyPaidMembership } from "../../shared/bnmMembershipLedger.ts";
import { membershipPlan } from "../../shared/bnmMembershipPolicy.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

async function rpc(url: string, method: string, params: any[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const payload = await response.json();
  if (!response.ok || payload?.error) throw new Error(payload?.error?.message || "Sepolia RPC request failed");
  return payload?.result;
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: "Authentication required" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const tier = String(body.tier || "");
    const txHash = String(body.tx_hash || "").trim();
    const plan = membershipPlan(tier);
    if (!plan || !plan.paymentRequired) return Response.json({ error: "Unsupported membership tier" }, { status: 400 });
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) return Response.json({ error: "Invalid transaction hash" }, { status: 400 });

    const rpcUrl = (Deno.env.get("BNM_SEPOLIA_RPC_URL") || "").trim();
    const receiver = (Deno.env.get("BNM_SEPOLIA_PAYMENT_RECEIVER") || "").trim().toLowerCase();
    const amountWei = (Deno.env.get(tier === "member_10" ? "BNM_SEPOLIA_MEMBERSHIP_10_WEI" : "BNM_SEPOLIA_MEMBERSHIP_20_WEI") || "").trim();
    const minConfirmations = Math.max(1, Number(Deno.env.get("BNM_SEPOLIA_MIN_CONFIRMATIONS") || "2"));
    if (!rpcUrl || !/^0x[0-9a-f]{40}$/.test(receiver) || !/^\d+$/.test(amountWei)) {
      return Response.json({ error: "Sepolia verifier is not configured", code: "CRYPTO_TESTNET_NOT_CONFIGURED" }, { status: 503 });
    }

    const existing = items(await base44.asServiceRole.entities.CryptoPaymentReceipt.filter({ tx_hash: txHash }, { limit: 1 }))[0] || null;
    if (existing) {
      if (existing.user_email !== user.email || existing.membership_tier !== tier) {
        return Response.json({ error: "Transaction was already used for another membership", code: "REPLAY_BLOCKED" }, { status: 409 });
      }
      return Response.json({ success: existing.status === "verified", idempotent: true, receipt: existing });
    }

    const tx = await rpc(rpcUrl, "eth_getTransactionByHash", [txHash]);
    const receipt = await rpc(rpcUrl, "eth_getTransactionReceipt", [txHash]);
    if (!tx || !receipt) return Response.json({ error: "Transaction is not confirmed yet", code: "TX_PENDING" }, { status: 409 });

    const to = String(tx.to || "").toLowerCase();
    const value = BigInt(tx.value || "0x0");
    const success = String(receipt.status || "").toLowerCase() === "0x1";
    if (!success) return Response.json({ error: "Transaction failed on Sepolia", code: "TX_FAILED" }, { status: 409 });
    if (to !== receiver) return Response.json({ error: "Payment destination does not match", code: "DESTINATION_MISMATCH" }, { status: 409 });
    if (value !== BigInt(amountWei)) return Response.json({ error: "Payment amount does not match the quote", code: "AMOUNT_MISMATCH" }, { status: 409 });

    const latestHex = await rpc(rpcUrl, "eth_blockNumber", []);
    const latest = Number(BigInt(latestHex));
    const mined = Number(BigInt(receipt.blockNumber));
    const confirmations = Math.max(0, latest - mined + 1);
    if (confirmations < minConfirmations) {
      return Response.json({ error: "Waiting for confirmations", code: "INSUFFICIENT_CONFIRMATIONS", confirmations, required: minConfirmations }, { status: 409 });
    }

    const cryptoReceipt = await base44.asServiceRole.entities.CryptoPaymentReceipt.create({
      idempotency_key: "sepolia:" + txHash.toLowerCase(),
      user_email: user.email,
      membership_tier: tier,
      network: "sepolia",
      chain_id: 11155111,
      tx_hash: txHash,
      from_address: String(tx.from || ""),
      to_address: String(tx.to || ""),
      asset: "ETH",
      amount_atomic: value.toString(),
      expected_usd_cents: plan.priceCents,
      confirmations,
      status: "verified",
      verified_at: new Date().toISOString(),
      verification_reason: "CHAIN_DESTINATION_AMOUNT_STATUS_CONFIRMATIONS_VERIFIED"
    });

    const membership = await applyPaidMembership(base44, {
      userEmail: user.email,
      tier: tier as "member_10" | "member_20",
      paymentMethod: "crypto_testnet",
      cryptoPaymentReceiptId: cryptoReceipt.id,
      sourceTransactionId: txHash
    });

    return Response.json({
      success: true,
      receipt_id: cryptoReceipt.id,
      entitlement_id: membership.entitlement?.id || null,
      grant_status: membership.entitlement?.grant_status || "blocked",
      infinity_coin_grant: plan.infinityCoinGrant,
      note: "Membership verified on Sepolia. Infinity Coin remains pending until governed mint execution is independently released."
    });
  } catch (error) {
    return Response.json({ error: error?.message || "Crypto payment verification failed" }, { status: 500 });
  }
}
