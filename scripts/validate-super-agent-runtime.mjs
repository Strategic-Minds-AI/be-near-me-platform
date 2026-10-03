import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const dataDir = process.env.AGENT_DATA_DIR || "/data";
const mode = process.argv[2] || "seed-and-verify";
const safeId = "ci-runtime-snapshot";
const protectedId = "ci-protected-guard";
const safeKey = "ci-safe-runtime-snapshot";
const protectedKey = "ci-protected-runtime-snapshot";

const file = (...parts) => path.join(dataDir, ...parts);
const exists = async (p) => access(p).then(() => true).catch(() => false);
const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function verifyPersisted() {
  const required = [
    file("queue","done",safeId + ".json"),
    file("queue","blocked",protectedId + ".json"),
    file("receipts",safeKey + ".json"),
    file("receipts","blocked-" + protectedId + ".json"),
    file("state","heartbeat.json"),
  ];
  for (const p of required) {
    if (!(await exists(p))) throw new Error("Missing persistent runtime artifact: " + p);
  }

  const safe = await readJson(file("receipts",safeKey + ".json"));
  const blocked = await readJson(file("receipts","blocked-" + protectedId + ".json"));
  const heartbeat = await readJson(file("state","heartbeat.json"));

  if (safe.status !== "PASS") throw new Error("Safe packet did not PASS");
  if (blocked.status !== "BLOCKED") throw new Error("Protected packet did not fail closed");
  if (!heartbeat.timestamp) throw new Error("Heartbeat missing timestamp");

  console.log(JSON.stringify({
    ok: true,
    mode,
    safe_status: safe.status,
    protected_status: blocked.status,
    heartbeat: heartbeat.timestamp,
  }));
}

if (mode === "verify-persisted") {
  await verifyPersisted();
  process.exit(0);
}

await writeFile(file("queue","pending",safeId + ".json"), JSON.stringify({
  id: safeId,
  project_id: "BNM-EA-V1",
  action_class: "READ",
  task_type: "runtime_snapshot",
  idempotency_key: safeKey,
  max_attempts: 1,
  timeout_ms: 15000,
}, null, 2));

await writeFile(file("queue","pending",protectedId + ".json"), JSON.stringify({
  id: protectedId,
  project_id: "BNM-EA-V1",
  action_class: "PROTECTED",
  task_type: "runtime_snapshot",
  idempotency_key: protectedKey,
  max_attempts: 1,
  timeout_ms: 15000,
}, null, 2));

const deadline = Date.now() + 45000;
while (Date.now() < deadline) {
  const ready =
    await exists(file("queue","done",safeId + ".json")) &&
    await exists(file("queue","blocked",protectedId + ".json"));
  if (ready) break;
  await sleep(1000);
}

await verifyPersisted();
