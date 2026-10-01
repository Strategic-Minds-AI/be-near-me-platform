import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function read(rel) {
  if (!exists(rel)) return "";
  return fs.readFileSync(full(rel), "utf8");
}

function pass(name) {
  passes.push(name);
}

function fail(name, detail) {
  failures.push({ name, detail });
}

function requireFile(rel, name = rel) {
  if (exists(rel)) pass(name);
  else fail(name, `Missing required file: ${rel}`);
}

function forbid(rel, pattern, name, detail) {
  const content = read(rel);
  if (!content) {
    fail(name, `Cannot inspect missing file: ${rel}`);
    return;
  }
  if (pattern.test(content)) fail(name, detail);
  else pass(name);
}

function requirePattern(rel, pattern, name, detail) {
  const content = read(rel);
  if (!content) {
    fail(name, `Cannot inspect missing file: ${rel}`);
    return;
  }
  if (pattern.test(content)) pass(name);
  else fail(name, detail);
}

requireFile("vercel.json", "SPA fallback configuration");
requirePattern(
  "vercel.json",
  /"handle"\s*:\s*"filesystem"[\s\S]*"dest"\s*:\s*"\/index\.html"/,
  "Filesystem-first SPA routing",
  "vercel.json must preserve real files before falling back to /index.html."
);

requireFile("public/manifest.json", "PWA manifest");
requirePattern(
  "public/manifest.json",
  /"name"\s*:\s*"Be Near Me"/,
  "Manifest brand identity",
  "public/manifest.json must identify the product as Be Near Me."
);

requirePattern(
  "src/lib/app-params.js",
  /DEFAULT_BASE44_APP_ID\s*=\s*["']6abd9e05a56938f03c2c557b["']/,
  "Base44 public app fallback",
  "Vercel previews must retain the verified Be Near Me Base44 app identifier fallback."
);
requirePattern(
  "src/lib/app-params.js",
  /DEFAULT_BASE44_BACKEND_URL\s*=\s*["']https:\/\/base44\.app["']/,
  "Base44 public backend fallback",
  "Vercel previews must retain the verified public Base44 backend fallback."
);

const donorChecks = [
  ["base44/config.jsonc", /VidioTube/i, "Base44 config donor brand", "base44/config.jsonc still contains VidioTube."],
  ["src/components/studio/StudioSidebar.jsx", /Back to Vidio|Vidio Studio/i, "Studio donor brand", "StudioSidebar still contains Vidio branding."],
  ["src/pages/Premium.jsx", /Vidio Premium/i, "Premium donor brand", "Premium page still contains Vidio Premium."],
  ["src/components/subscription/PremiumBanner.jsx", /Vidio Premium/i, "Premium banner donor brand", "Premium banner still contains Vidio Premium."],
  ["src/pages/Notifications.jsx", /["']Vidio["']/, "Notification donor brand", "Notifications still uses Vidio as a visible fallback brand."],
  ["src/pages/StudioLive.jsx", /live\.vidio\.app/i, "Invalid donor RTMP dependency", "StudioLive still points at live.vidio.app."],
];

for (const args of donorChecks) forbid(...args);

forbid(
  "base44/functions/autoScraper/entry.ts",
  /Math\.random\s*\(/,
  "Auto scraper synthetic engagement",
  "autoScraper must not manufacture engagement metrics with Math.random()."
);
forbid(
  "base44/functions/scrapeVideos/entry.ts",
  /Math\.random\s*\(/,
  "Manual scraper synthetic engagement",
  "scrapeVideos must not manufacture engagement metrics with Math.random()."
);
forbid(
  "base44/functions/autoScraper/entry.ts",
  /epoxy|concrete|DIY home improvement/i,
  "Be Near Me scraper scope",
  "autoScraper still contains unrelated epoxy/concrete/DIY acquisition queries."
);
requirePattern(
  "base44/functions/autoScraper/entry.ts",
  /visibility:\s*['"]unlisted['"]/,
  "Auto scraper review-only visibility",
  "Scheduled external imports must enter as unlisted review candidates."
);
requirePattern(
  "base44/functions/autoScraper/entry.ts",
  /asServiceRole\.entities\.Video\.bulkCreate/,
  "Auto scraper governed service write",
  "Scheduled system ingestion must use an explicit service-role write."
);

requirePattern(
  "base44/functions/autoScraper/entry.ts",
  /auth\.me\(\)[\s\S]*user\.role\s*!==\s*['"]admin['"]/,
  "Auto scraper admin authentication gate",
  "autoScraper must authenticate and require an admin caller before service-role operations."
);
forbid(
  "base44/functions/autoScraper/entry.ts",
  /workflow context\s*[—-]\s*no user session/i,
  "Auto scraper anonymous workflow fallback",
  "autoScraper must not treat an unauthenticated scheduled workflow as a trusted caller."
);
const workflowsDir = "base44/workflows";
if (exists(workflowsDir)) {
  const scheduledWorkflows = fs.readdirSync(full(workflowsDir))
    .filter((name) => name.endsWith(".jsonc"))
    .map((name) => `${workflowsDir}/${name}`)
    .filter((rel) => /"trigger_type"\s*:\s*"scheduled"|"schedule_mode"\s*:\s*"recurring"/i.test(read(rel)));

  if (scheduledWorkflows.length > 0) {
    fail(
      "Single-heartbeat workflow scheduling",
      `Recurring Base44 schedules are not allowed; route through the governed heartbeat: ${scheduledWorkflows.join(", ")}`
    );
  } else {
    pass("Single-heartbeat workflow scheduling");
  }
} else {
  pass("Single-heartbeat workflow scheduling");
}
requirePattern(
  "base44/functions/scrapeVideos/entry.ts",
  /visibility:\s*['"]unlisted['"]/,
  "Manual scraper review-first visibility",
  "Scraped external videos must be reviewed before public visibility."
);

forbid(
  "src/pages/Dares.jsx",
  /base44\.entities\.Dare\.create\s*\(/,
  "Dare server-derived creation",
  "Dares.jsx must not create Dare records directly from browser-supplied ownership fields."
);
forbid(
  "src/pages/Truths.jsx",
  /base44\.entities\.Truth\.create\s*\(/,
  "Truth server-derived creation",
  "Truths.jsx must not create Truth records directly from browser-supplied ownership fields."
);
forbid(
  "src/pages/Dares.jsx",
  /base44\.entities\.Dare\.update\s*\(/,
  "Dare protected mutations",
  "Dares.jsx still performs direct client-side Dare updates."
);
forbid(
  "src/pages/Truths.jsx",
  /base44\.entities\.Truth\.update\s*\(/,
  "Truth protected mutations",
  "Truths.jsx still performs direct client-side Truth updates."
);

requireFile("base44/functions/updateDareState/entry.ts", "Dare state transition function");
requireFile("base44/functions/updateTruthState/entry.ts", "Truth state transition function");
requirePattern(
  "base44/functions/updateDareState/entry.ts",
  /asServiceRole\.entities\.Dare\.create/,
  "Dare service-role creation",
  "updateDareState must derive ownership server-side and create through asServiceRole."
);
requirePattern(
  "base44/functions/updateDareState/entry.ts",
  /asServiceRole\.entities\.Dare\.update/,
  "Dare service-role mutation",
  "updateDareState must perform validated writes through asServiceRole."
);
forbid(
  "src/pages/Dares.jsx",
  /handleVerify/,
  "Independent dare verification",
  "The dare initiator UI must not self-verify submitted proof."
);
requirePattern(
  "base44/functions/updateTruthState/entry.ts",
  /asServiceRole\.entities\.Truth\.create/,
  "Truth service-role creation",
  "updateTruthState must derive ownership server-side and create through asServiceRole."
);
requirePattern(
  "base44/functions/updateTruthState/entry.ts",
  /asServiceRole\.entities\.Truth\.update/,
  "Truth service-role mutation",
  "updateTruthState must perform validated writes through asServiceRole."
);
requirePattern(
  "base44/functions/processReward/entry.ts",
  /asServiceRole\.entities\.(Dare|Truth)\.update/,
  "Reward service-role mutation",
  "processReward must perform protected writes through asServiceRole."
);
requirePattern(
  "base44/functions/processReward/entry.ts",
  /transfer_performed:\s*false/,
  "Reward transfer truthfulness",
  "processReward must explicitly state that no blockchain transfer is performed."
);
requirePattern(
  "base44/functions/processReward/entry.ts",
  /created_by:\s*dare\.challenger_email/,
  "Dare reward notification recipient",
  "Dare reward notifications must be assigned to the challenger."
);
requirePattern(
  "base44/functions/processReward/entry.ts",
  /created_by:\s*truth\.responder_email/,
  "Truth reward notification recipient",
  "Truth reward notifications must be assigned to the responder."
);
forbid(
  "base44/functions/updateDareState/entry.ts",
  /case\s+["']verify["']|action\s*===\s*["']verify["']/,
  "Dare verifier separation",
  "User state-transition code must not provide a self-verification action."
);

for (const entity of ["Dare", "Truth"]) {
  const rel = `base44/entities/${entity}.jsonc`;
  const content = read(rel);
  if (!content) {
    fail(`${entity} RLS`, `Missing ${rel}`);
    continue;
  }
  try {
    const schema = JSON.parse(content);
    for (const operation of ["create", "update", "delete"]) {
      const rule = schema?.rls?.[operation];
      if (rule?.user_condition?.role === "admin") {
        pass(`${entity} RLS ${operation} lock`);
      } else {
        fail(
          `${entity} RLS ${operation} lock`,
          `${entity}.rls.${operation} must be admin-only; user state changes belong in validated backend functions.`
        );
      }
    }
  } catch (error) {
    fail(`${entity} schema parse`, error.message);
  }
}

forbid(
  "src/pages/Dares.jsx",
  /Infinity Coin has been sent/i,
  "Dare reward truthfulness",
  "Dares UI must not claim a blockchain/token transfer that processReward does not perform."
);
forbid(
  "src/pages/Truths.jsx",
  /Infinity Coin has been sent/i,
  "Truth reward truthfulness",
  "Truths UI must not claim a blockchain/token transfer that processReward does not perform."
);
forbid(
  "src/components/wallet/TokenGenerator.jsx",
  />\s*Generate ERC-20 Token\s*</i,
  "Token generator truthfulness",
  "TokenGenerator must not claim to deploy an ERC-20 contract when it only creates a token definition."
);
forbid(
  "src/components/wallet/TokenGenerator.jsx",
  /Token generated/i,
  "Token completion truthfulness",
  "TokenGenerator must describe a definition/proposal, not a deployed token."
);

forbid(
  "src/components/wallet/TokenGenerator.jsx",
  /getCreateAddress|getCreate2Address|Contract address is derived/i,
  "Token address truthfulness",
  "TokenGenerator must not fabricate a prospective contract address before deployment."
);
requirePattern(
  "src/components/wallet/TokenGenerator.jsx",
  /No smart contract is deployed|No blockchain deployment occurred/i,
  "Token definition disclosure",
  "TokenGenerator must clearly disclose that saving a definition performs no blockchain deployment."
);

const phase = process.env.VALIDATION_PHASE || "hardening";
if (phase === "release") {
  requireFile("public/robots.txt", "Release robots.txt");
  requireFile("public/sitemap.xml", "Release sitemap.xml");
}

console.log("\nDeterministic validation results");
console.log("--------------------------------");
for (const name of passes) console.log(`PASS  ${name}`);
for (const item of failures) console.error(`FAIL  ${item.name}: ${item.detail}`);
console.log("--------------------------------");
console.log(`${passes.length} passed; ${failures.length} failed; phase=${phase}`);

if (failures.length > 0) process.exit(1);
