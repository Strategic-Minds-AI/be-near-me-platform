import { BNM_MEMBERSHIP_ECONOMICS_VERSION, membershipPlan } from "./bnmMembershipPolicy.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

async function grantState(base44: any, userEmail: string) {
  const wallets = items(await base44.asServiceRole.entities.Wallet.filter(
    { created_by: userEmail, network: "sepolia" },
    { sort: "-created_date", limit: 1 }
  ));
  const tokens = items(await base44.asServiceRole.entities.Token.filter(
    { name: "Infinity Coin", network: "sepolia", status: "deployed" },
    { sort: "-created_date", limit: 1 }
  ));
  const wallet = wallets[0] || null;
  const token = tokens[0] || null;
  if (!wallet) return { status: "pending_wallet", wallet, token, reason: "SEPOLIA_WALLET_REQUIRED" };
  if (!token?.contract_address) return { status: "pending_token", wallet, token, reason: "INFINITY_COIN_TESTNET_CONTRACT_REQUIRED" };
  return { status: "pending_mint", wallet, token, reason: "GOVERNED_MINT_EXECUTOR_NOT_RELEASED" };
}

export async function queueInfinityCoinActivityReward(base44: any, input: {
  userEmail: string;
  sourceKind: "dare" | "truth" | "other";
  sourceId: string;
  amount: number;
  reason: string;
}) {
  const entitlements = items(await base44.asServiceRole.entities.MembershipEntitlement.filter(
    { user_email: input.userEmail, status: "active" },
    { sort: "-created_date", limit: 20 }
  ));
  const entitlement = entitlements.find((item: any) =>
    item.infinity_coin_enabled === true &&
    (item.tier === "member_10" || item.tier === "member_20")
  ) || null;

  if (!entitlement) {
    return { eligible: false, amount: 0, status: "not_eligible", ledger: null };
  }

  const amount = Math.max(0, Math.trunc(Number(input.amount || 0)));
  if (amount <= 0) {
    return { eligible: true, amount: 0, status: "blocked", ledger: null, reason: "NON_POSITIVE_REWARD" };
  }

  const idempotencyKey = "activity-reward:" + input.sourceKind + ":" + input.sourceId + ":" + input.userEmail.toLowerCase();
  const existing = items(await base44.asServiceRole.entities.TokenLedgerEntry.filter(
    { idempotency_key: idempotencyKey },
    { limit: 1 }
  ))[0] || null;
  if (existing) {
    return { eligible: true, amount, status: existing.status, ledger: existing, idempotent: true };
  }

  const state = await grantState(base44, input.userEmail);
  const ledger = await base44.asServiceRole.entities.TokenLedgerEntry.create({
    idempotency_key: idempotencyKey,
    user_email: input.userEmail,
    membership_entitlement_id: entitlement.id,
    source_type: "activity_reward",
    source_id: input.sourceKind + ":" + input.sourceId,
    source_payment_receipt_id: "",
    token_name: "Infinity Coin",
    token_symbol: "IC",
    amount,
    direction: "credit",
    status: state.status,
    wallet_id: state.wallet?.id || "",
    wallet_address: state.wallet?.address || "",
    contract_address: state.token?.contract_address || "",
    network: state.wallet ? "sepolia" : "offchain",
    transaction_id: "",
    tx_hash: "",
    reason: input.reason + " / " + state.reason,
    validator_status: "BLOCKED"
  });

  return { eligible: true, amount, status: ledger.status, ledger, idempotent: false };
}

export async function applyPaidMembership(base44: any, input: {
  userEmail: string;
  tier: "member_10" | "member_20";
  paymentMethod: "stripe" | "crypto_testnet" | "crypto";
  paymentReceiptId?: string;
  cryptoPaymentReceiptId?: string;
  sourceTransactionId?: string;
}) {
  const plan = membershipPlan(input.tier);
  if (!plan || !plan.paymentRequired) throw new Error("Invalid paid membership tier");

  const sourceFilter = input.paymentReceiptId
    ? { payment_receipt_id: input.paymentReceiptId }
    : { crypto_payment_receipt_id: input.cryptoPaymentReceiptId };

  const existing = items(await base44.asServiceRole.entities.MembershipEntitlement.filter(sourceFilter, { limit: 1 }))[0] || null;
  if (existing) return { entitlement: existing, idempotent: true };

  const prior = items(await base44.asServiceRole.entities.MembershipEntitlement.filter(
    { user_email: input.userEmail, status: "active" },
    { sort: "-created_date", limit: 20 }
  ));
  for (const item of prior) {
    if (item.tier !== input.tier) {
      await base44.asServiceRole.entities.MembershipEntitlement.update(item.id, { status: "cancelled" });
    }
  }

  const state = await grantState(base44, input.userEmail);
  const entitlement = await base44.asServiceRole.entities.MembershipEntitlement.create({
    user_email: input.userEmail,
    tier: input.tier,
    status: "active",
    price_cents: plan.priceCents,
    currency: "usd",
    payment_method: input.paymentMethod,
    payment_receipt_id: input.paymentReceiptId || "",
    crypto_payment_receipt_id: input.cryptoPaymentReceiptId || "",
    infinity_coin_enabled: true,
    infinity_coin_membership_grant: plan.infinityCoinGrant,
    grant_status: state.status,
    economics_version: BNM_MEMBERSHIP_ECONOMICS_VERSION,
    economic_decision: plan.economicDecision,
    activated_at: new Date().toISOString(),
    description: "Verified paid membership. Infinity Coin grant remains pending until governed on-chain mint validation passes."
  });

  const sourceId = input.paymentReceiptId || input.cryptoPaymentReceiptId || "";
  const idempotencyKey = "membership-grant:" + sourceId;
  let ledger = items(await base44.asServiceRole.entities.TokenLedgerEntry.filter({ idempotency_key: idempotencyKey }, { limit: 1 }))[0] || null;
  if (!ledger) {
    ledger = await base44.asServiceRole.entities.TokenLedgerEntry.create({
      idempotency_key: idempotencyKey,
      user_email: input.userEmail,
      membership_entitlement_id: entitlement.id,
      source_type: "membership_grant",
      source_id: sourceId,
      source_payment_receipt_id: input.paymentReceiptId || "",
      token_name: "Infinity Coin",
      token_symbol: "IC",
      amount: plan.infinityCoinGrant,
      direction: "credit",
      status: state.status,
      wallet_id: state.wallet?.id || "",
      wallet_address: state.wallet?.address || "",
      contract_address: state.token?.contract_address || "",
      network: state.wallet ? "sepolia" : "offchain",
      transaction_id: input.sourceTransactionId || "",
      tx_hash: "",
      reason: state.reason,
      validator_status: "BLOCKED"
    });
  }

  return { entitlement, ledger, idempotent: false };
}

export async function reverseMembershipForReceipt(base44: any, paymentReceiptId: string, reason: string) {
  const entitlement = items(await base44.asServiceRole.entities.MembershipEntitlement.filter(
    { payment_receipt_id: paymentReceiptId },
    { limit: 1 }
  ))[0] || null;
  if (!entitlement) return { reversed: false, reason: "entitlement_not_found" };

  const ledgers = items(await base44.asServiceRole.entities.TokenLedgerEntry.filter(
    { source_payment_receipt_id: paymentReceiptId },
    { limit: 20 }
  ));

  for (const entry of ledgers) {
    const status = entry.tx_hash ? "reversal_pending" : "reversed";
    await base44.asServiceRole.entities.TokenLedgerEntry.update(entry.id, {
      status,
      reason,
      validator_status: entry.tx_hash ? "BLOCKED" : "PASS",
      validated_at: new Date().toISOString()
    });
  }

  await base44.asServiceRole.entities.MembershipEntitlement.update(entitlement.id, {
    status: reason === "refund" ? "refunded" : "revoked",
    grant_status: ledgers.some((entry: any) => entry.tx_hash) ? "reversal_pending" : "reversed"
  });

  return { reversed: true, entitlement_id: entitlement.id };
}
