import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));

const passes = [];
const failures = [];
const blockers = [];

function pass(id, detail) { passes.push({ id, detail }); }
function fail(id, detail) { failures.push({ id, detail }); }
function block(id, detail) { blockers.push({ id, detail }); }
function includes(text, needle) { return text.includes(needle); }
function assert(condition, id, detail) { condition ? pass(id, detail) : fail(id, detail); }

const registry = json("docs/CREATE_CAPABILITY_REGISTRY.json");
const binding = json("docs/BNM_V2_BINDING_STATUS.json");
const policy = read("base44/shared/bnmMembershipPolicy.ts");
const checkout = read("base44/functions/createPaymentCheckout/entry.ts");
const webhook = read("base44/functions/stripeWebhook/entry.ts");
const cryptoQuote = read("base44/functions/createCryptoMembershipQuote/entry.ts");
const cryptoVerify = read("base44/functions/verifyCryptoMembershipPayment/entry.ts");
const ledger = read("base44/shared/bnmMembershipLedger.ts");
const reward = read("base44/functions/processReward/entry.ts");
const tokenSchema = json("base44/entities/Token.jsonc");
const tokenGenerator = read("src/components/wallet/TokenGenerator.jsx");
const nativeAuth = read("src/lib/nativeAuth.js");
const supabaseClient = read("src/lib/supabaseClient.js");
const app = read("src/App.jsx");
const splash = read("src/pages/Splash.jsx");
const base44Client = read("src/api/base44Client.js");

const capIds = new Set(registry.capabilities.map((x) => x.id));
for (const id of [
  "record_video","upload_video","camera_effects","ai_video","picture_to_video","viral_video",
  "kindness_dare","truth","live","nearby","community_post","playlist","ai_clip_factory","media_kit",
  "create_channel","creator_studio","creator_content","ai_coach","tracker","rewards","membership"
]) {
  assert(capIds.has(id), "CREATE_CAPABILITY_" + id.toUpperCase(), id);
}

const fakeAnalytics = registry.capabilities.find((x) => x.id === "legacy_analytics");
const fakeEarnings = registry.capabilities.find((x) => x.id === "legacy_earnings");
assert(fakeAnalytics?.status === "EXCLUDED_NO_FAKE_DATA", "NO_FAKE_ANALYTICS", fakeAnalytics?.status || "missing");
assert(fakeEarnings?.status === "EXCLUDED_NO_FAKE_DATA", "NO_FAKE_EARNINGS", fakeEarnings?.status || "missing");

assert(/free:[\s\S]*priceCents:\s*0[\s\S]*infinityCoinGrant:\s*0[\s\S]*infinityCoinEnabled:\s*false/.test(policy), "FREE_TIER_POLICY", "$0 / 0 IC / IC disabled");
assert(/member_10:[\s\S]*priceCents:\s*1000[\s\S]*infinityCoinGrant:\s*25/.test(policy), "MEMBER_10_POLICY", "$10 / 25 IC");
assert(/member_20:[\s\S]*priceCents:\s*2000[\s\S]*infinityCoinGrant:\s*50[\s\S]*INFERRED_DEFAULT_PENDING_FINAL_ECONOMIC_APPROVAL/.test(policy), "MEMBER_20_STAGING_POLICY", "$20 / 50 IC inferred staging default");

assert(includes(checkout, "membership_10") && includes(checkout, "membership_20"), "STRIPE_MEMBERSHIP_PRODUCTS", "membership_10 + membership_20");
assert(includes(checkout, "STRIPE_SECRET_KEY") && includes(checkout, "BNM_LIVE_PAYMENTS_ENABLED"), "STRIPE_FAIL_CLOSED", "secret + live gate");
assert(includes(webhook, "constructEvent") || includes(webhook, "stripe-signature") || includes(webhook, "STRIPE_WEBHOOK_SECRET"), "STRIPE_WEBHOOK_VERIFICATION", "signature verification present");
assert(includes(webhook, "applyPaidMembership"), "STRIPE_ENTITLEMENT_BINDING", "verified receipt -> membership");
assert(includes(webhook, "reverseMembershipForReceipt"), "STRIPE_REVERSAL_BINDING", "refund/dispute -> entitlement reversal");

assert(includes(cryptoQuote, "11155111") && includes(cryptoQuote, "sepolia"), "CRYPTO_SEPOLIA_ONLY_QUOTE", "Sepolia quote");
for (const token of ["eth_getTransactionByHash","eth_getTransactionReceipt","DESTINATION_MISMATCH","AMOUNT_MISMATCH","INSUFFICIENT_CONFIRMATIONS","REPLAY_BLOCKED"]) {
  assert(includes(cryptoVerify, token), "CRYPTO_VERIFY_" + token.replace(/[^A-Z0-9]+/gi,"_").toUpperCase(), token);
}

assert(includes(ledger, "idempotencyKey") && includes(ledger, "TokenLedgerEntry"), "TOKEN_LEDGER_IDEMPOTENCY", "idempotent ledger path");
assert(includes(ledger, "pending_wallet") && includes(ledger, "pending_token") && includes(ledger, "pending_mint"), "TOKEN_LEDGER_FAIL_CLOSED", "no mint proof => pending state");
assert(includes(reward, "eligible_for_infinity_coin: false") && includes(reward, "infinity_coin_amount: 0"), "FREE_ACTIVITY_ZERO_IC", "free participation settles at 0 IC");
assert(includes(reward, "queueInfinityCoinActivityReward"), "PAID_ACTIVITY_LEDGER", "paid reward uses ledger queue");
assert(!includes(reward, "Reward received!"), "NO_FALSE_REWARD_RECEIVED_BACKEND", "no unverified receipt claim");

assert(tokenSchema.properties?.supply_model?.enum?.includes("unlimited_mintable"), "TOKEN_UNLIMITED_MODEL", "unlimited_mintable");
assert(tokenSchema.properties?.mint_authority_mode?.enum?.includes("governed_backend"), "TOKEN_GOVERNED_MINT_MODEL", "governed_backend");
assert(includes(tokenGenerator, "Infinity Coin") && includes(tokenGenerator, "unlimited_mintable"), "INFINITY_COIN_TEMPLATE", "existing no-code generator upgraded");
assert(includes(tokenGenerator, 'wallet.network !== "sepolia"'), "INFINITY_COIN_SEPOLIA_GATE", "mainnet blocked in generator");
assert(includes(tokenGenerator, 'status: "defined"') && includes(tokenGenerator, 'deployment_validator_status: "BLOCKED"'), "NO_FAKE_TOKEN_DEPLOYMENT", "definition != deployed");

assert(includes(nativeAuth, "signUp") && includes(nativeAuth, "signInWithPassword") && includes(nativeAuth, "signInWithOtp"), "NATIVE_AUTH_METHODS", "password + magic link");
assert(includes(supabaseClient, "persistSession: true") && includes(supabaseClient, "autoRefreshToken: true"), "NATIVE_AUTH_SESSION", "persistent refreshable session");
assert(!includes(splash, "redirectToLogin"), "NO_FORCED_EXTERNAL_LOGIN_SPLASH", "no redirectToLogin");
assert(includes(base44Client, 'prop === "redirectToLogin"') && includes(base44Client, '"/account?next="'), "LEGACY_LOGIN_INTERCEPT", "legacy redirect routed to native account boundary");
assert(includes(app, '<Route path="/account"') && includes(app, '<Route path="/membership"'), "NATIVE_ACCOUNT_MEMBERSHIP_ROUTES", "/account + /membership");

if (binding.status !== "PASS") {
  for (const [name, evidence] of Object.entries(binding.evidence || {})) {
    if (evidence?.conclusion === "BLOCKED") block("BINDING_" + name.toUpperCase(), evidence.reason || name);
  }
}

const status = failures.length ? "FAIL" : blockers.length ? "BLOCKED" : "PASS";
const receipt = {
  gate_id: "BNM-V2-RELEASE-GATE",
  mission_id: "BNM-FULL-AUTONOMOUS-CONVERGENCE-V2",
  status,
  source_sha: process.env.GITHUB_SHA || null,
  passed: passes.length,
  failed: failures.length,
  blocked: blockers.length,
  passes,
  failures,
  blockers,
  rule: "NO EVIDENCE = NO PASS"
};

fs.mkdirSync(path.join(root, "validation/receipts"), { recursive: true });
fs.writeFileSync(path.join(root, "validation/receipts/latest-bnm-v2.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));

if (failures.length) process.exit(1);
if (blockers.length) process.exit(2);
