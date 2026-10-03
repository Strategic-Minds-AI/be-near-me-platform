import http from "node:http";
import { readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { ACTION_CLASSES, AUTO_CLASSES, runtimeConfig } from "./config.mjs";
import { acquireLease, atomicJson, emitReceipt, ensureRuntimeDirs, hash, readJson, releaseLease, safeFileName } from "./io.mjs";
import { executeTask } from "./tasks.mjs";

const config = runtimeConfig();
let lastCycle = null;
let lastHeartbeat = null;
let shuttingDown = false;

function validatePacket(packet) {
  const required = ["id","project_id","action_class","task_type","idempotency_key"];
  for (const key of required) if (!packet?.[key]) throw new Error("Missing " + key);
  if (!Object.values(ACTION_CLASSES).includes(packet.action_class)) throw new Error("Invalid action_class");
  if (packet.project_id !== config.projectId) throw new Error("Wrong project_id");
  packet.max_attempts = Math.max(1, Math.min(5, Number(packet.max_attempts || 2)));
  packet.timeout_ms = Math.max(1000, Math.min(600000, Number(packet.timeout_ms || 60000)));
  return packet;
}

async function blocked(packet, reason) {
  const receipt = await emitReceipt(config, {
    receipt_id: "blocked-" + packet.id,
    idempotency_key: packet.idempotency_key,
    packet_id: packet.id,
    status: "BLOCKED",
    reason,
  });
  return receipt;
}

async function processPacket(file) {
  const pending = path.join(config.dataDir, "queue", "pending", file);
  const working = path.join(config.dataDir, "queue", "working", file);
  await rename(pending, working);

  let packet;
  try {
    packet = validatePacket(await readJson(working));
    const receiptKey = safeFileName(packet.idempotency_key);
    const prior = path.join(config.dataDir, "receipts", receiptKey + ".json");
    try {
      const existing = await readJson(prior);
      await rename(working, path.join(config.dataDir, "queue", "done", file));
      return { status: "IDEMPOTENT", receipt: existing };
    } catch {}

    if (!AUTO_CLASSES.has(packet.action_class)) {
      await blocked(packet, "Protected actions are never auto-executed by the Super-Agent runtime.");
      await rename(working, path.join(config.dataDir, "queue", "blocked", file));
      return { status: "BLOCKED" };
    }

    let result;
    let error = null;
    for (let attempt = 1; attempt <= packet.max_attempts; attempt++) {
      try {
        result = await executeTask(packet, config);
        if (result?.ok) break;
        error = new Error("Task returned non-passing result");
      } catch (e) {
        error = e;
      }
      if (attempt < packet.max_attempts) await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 10000)));
    }

    const status = result?.ok ? "PASS" : "FAIL";
    const receipt = await emitReceipt(config, {
      receipt_id: receiptKey,
      idempotency_key: packet.idempotency_key,
      packet_id: packet.id,
      action_class: packet.action_class,
      task_type: packet.task_type,
      packet_hash: hash(packet),
      status,
      result: result || null,
      error: error ? String(error.message || error) : null,
    });

    await rename(working, path.join(config.dataDir, "queue", status === "PASS" ? "done" : "dead-letter", file));
    return { status, receipt };
  } catch (error) {
    const fallback = packet || { id: file, idempotency_key: file };
    await emitReceipt(config, {
      receipt_id: "invalid-" + safeFileName(fallback.id),
      idempotency_key: fallback.idempotency_key,
      packet_id: fallback.id,
      status: "FAIL",
      error: String(error.message || error),
    });
    await rename(working, path.join(config.dataDir, "queue", "dead-letter", file)).catch(() => rm(working, { force: true }));
    return { status: "FAIL" };
  }
}

async function heartbeat(extra = {}) {
  lastHeartbeat = {
    runtime: "BNM-SUPER-AGENT-1",
    project_id: config.projectId,
    source_sha: config.sourceSha,
    pid: process.pid,
    node: process.version,
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    ...extra,
  };
  await atomicJson(path.join(config.dataDir, "state", "heartbeat.json"), lastHeartbeat);
}

async function cycle() {
  const lease = await acquireLease(config.dataDir, config.leaseMs);
  if (!lease.ok) {
    await heartbeat({ state: "standby", lease_owner: lease.lease?.owner || null });
    return;
  }

  const started = Date.now();
  const cycleReceipt = { processed: 0, pass: 0, fail: 0, blocked: 0 };
  try {
    const files = (await readdir(path.join(config.dataDir, "queue", "pending")))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .slice(0, config.concurrency);

    for (const file of files) {
      const result = await processPacket(file);
      cycleReceipt.processed += 1;
      if (result.status === "PASS" || result.status === "IDEMPOTENT") cycleReceipt.pass += 1;
      else if (result.status === "BLOCKED") cycleReceipt.blocked += 1;
      else cycleReceipt.fail += 1;
    }

    lastCycle = { ...cycleReceipt, duration_ms: Date.now() - started, completed_at: new Date().toISOString() };
    await emitReceipt(config, {
      receipt_id: "heartbeat-" + Date.now(),
      status: cycleReceipt.fail ? "FAIL" : "PASS",
      kind: "reconcile_cycle",
      ...lastCycle,
    });
    await heartbeat({ state: cycleReceipt.fail ? "degraded" : "healthy", last_cycle: lastCycle });
  } finally {
    await releaseLease(lease);
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET") { res.writeHead(405); return res.end(); }
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, project_id: config.projectId, source_sha: config.sourceSha }));
  }
  if (req.url === "/readyz") {
    const fresh = lastHeartbeat && (Date.now() - new Date(lastHeartbeat.timestamp).getTime() < config.pollMs * 2 + 60000);
    res.writeHead(fresh ? 200 : 503, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ready: Boolean(fresh), heartbeat: lastHeartbeat }));
  }
  if (req.url === "/status") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ config: { ...config, receiptToken: config.receiptToken ? "[configured]" : "" }, lastHeartbeat, lastCycle }));
  }
  res.writeHead(404); res.end();
});

await ensureRuntimeDirs(config.dataDir);
await heartbeat({ state: "starting" });
server.listen(config.httpPort, "0.0.0.0", () => {
  console.log(JSON.stringify({ event: "super_agent_started", project_id: config.projectId, port: config.httpPort, source_sha: config.sourceSha }));
});

const loop = async () => {
  if (shuttingDown) return;
  await cycle().catch(async (error) => {
    await emitReceipt(config, { receipt_id: "cycle-error-" + Date.now(), status: "FAIL", kind: "runtime_error", error: String(error.message || error) });
    await heartbeat({ state: "degraded", error: String(error.message || error) });
  });
  if (!shuttingDown) setTimeout(loop, config.pollMs).unref();
};
await loop();

for (const signal of ["SIGTERM","SIGINT"]) {
  process.on(signal, async () => {
    shuttingDown = true;
    await heartbeat({ state: "stopping", signal }).catch(() => {});
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
