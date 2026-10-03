import http from "node:http";
import { readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { ACTION_CLASSES, AUTO_CLASSES, runtimeConfig } from "./config.mjs";
import { acquireLease, atomicJson, emitReceipt, ensureRuntimeDirs, hash, readJson, releaseLease, safeFileName } from "./io.mjs";
import { executeTask } from "./tasks.mjs";
import { packetFromX1Lease, X1Store } from "./x1-store.mjs";

const config = runtimeConfig();
const x1 = config.x1.enabled ? new X1Store(config) : null;
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

async function emitAll(receipt) {
  const local = await emitReceipt(config, receipt);
  if (x1) await x1.emitReceipt(local);
  return local;
}

async function blocked(packet, reason) {
  return emitAll({
    receipt_id: "blocked-" + packet.id,
    idempotency_key: packet.idempotency_key,
    packet_id: packet.id,
    status: "BLOCKED",
    kind: "work_packet",
    reason,
  });
}

async function processLocalPacket(file) {
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
    const receipt = await emitAll({
      receipt_id: receiptKey,
      idempotency_key: packet.idempotency_key,
      packet_id: packet.id,
      action_class: packet.action_class,
      task_type: packet.task_type,
      packet_hash: hash(packet),
      status,
      kind: "work_packet",
      result: result || null,
      error: error ? String(error.message || error) : null,
    });

    await rename(working, path.join(config.dataDir, "queue", status === "PASS" ? "done" : "dead-letter", file));
    return { status, receipt };
  } catch (error) {
    const fallback = packet || { id: file, idempotency_key: file };
    await emitAll({
      receipt_id: "invalid-" + safeFileName(fallback.id),
      idempotency_key: fallback.idempotency_key,
      packet_id: fallback.id,
      status: "FAIL",
      kind: "work_packet",
      error: String(error.message || error),
    });
    await rename(working, path.join(config.dataDir, "queue", "dead-letter", file)).catch(() => rm(working, { force: true }));
    return { status: "FAIL" };
  }
}

async function processDurableWork(work) {
  const packet = validatePacket(packetFromX1Lease(work, config));

  if (!AUTO_CLASSES.has(packet.action_class)) {
    await blocked(packet, "Protected X1 work is fail-closed in the Be Near Me worker.");
    await x1.finishWork(packet, "BLOCKED", "PROTECTED_ACTION_CLASS");
    return { status: "BLOCKED" };
  }

  let executionId = null;
  let heartbeatTimer = null;
  try {
    executionId = await x1.claimExecution(work, packet);
    const heartbeatEveryMs = Math.max(10000, Math.min(60000, Math.floor(config.x1.leaseTtlSeconds * 1000 / 3)));
    heartbeatTimer = setInterval(() => {
      x1.heartbeatLease(packet).catch(() => {});
    }, heartbeatEveryMs);
    heartbeatTimer.unref?.();

    const result = await executeTask(packet, config);
    if (!result?.ok) throw new Error("Task returned non-passing result");

    const receipt = await emitAll({
      receipt_id: safeFileName(packet.idempotency_key + "-attempt-" + packet.x1.attempt),
      idempotency_key: packet.idempotency_key,
      packet_id: packet.id,
      action_class: packet.action_class,
      x1_action_class: packet.x1.original_action_class,
      task_type: packet.task_type,
      packet_hash: hash(packet),
      status: "PASS",
      kind: "work_packet",
      result,
    });

    await x1.completeExecution(executionId, receipt.receipt_id);
    await x1.finishWork(packet, "COMPLETED");
    return { status: "PASS", receipt };
  } catch (error) {
    const fingerprint = hash({
      packet_id: packet.id,
      attempt: packet.x1.attempt,
      error: String(error.message || error),
    });

    let receipt = null;
    try {
      receipt = await emitAll({
        receipt_id: safeFileName(packet.idempotency_key + "-attempt-" + packet.x1.attempt + "-failed"),
        idempotency_key: packet.idempotency_key,
        packet_id: packet.id,
        action_class: packet.action_class,
        x1_action_class: packet.x1.original_action_class,
        task_type: packet.task_type,
        packet_hash: hash(packet),
        status: "FAIL",
        kind: "work_packet",
        failure_fingerprint: fingerprint,
        error: String(error.message || error),
      });
    } catch {}

    if (executionId) await x1.failExecution(executionId, fingerprint).catch(() => {});
    await x1.finishWork(packet, "FAILED", receipt ? "TASK_FAILED" : "RECEIPT_FAILED").catch(() => {});
    return { status: "FAIL", receipt };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}

async function heartbeat(extra = {}) {
  lastHeartbeat = {
    runtime: "BNM-SUPER-AGENT-1",
    project_id: config.projectId,
    source_sha: config.sourceSha,
    durable_backend: x1 ? "x1_supabase" : "local_filesystem",
    pid: process.pid,
    node: process.version,
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    ...extra,
  };
  await atomicJson(path.join(config.dataDir, "state", "heartbeat.json"), lastHeartbeat);
}

async function monitor() {
  if (!config.watchUrls.length) return { ok: true, configured: false, results: [] };
  try {
    const result = await executeTask({
      task_type: "http_check",
      params: { urls: config.watchUrls },
      timeout_ms: 30000,
    }, config);
    return { configured: true, ...result };
  } catch (error) {
    return { ok: false, configured: true, results: [], error: String(error.message || error) };
  }
}

async function cycleLocal() {
  const lease = await acquireLease(config.dataDir, config.leaseMs);
  if (!lease.ok) {
    await heartbeat({ state: "standby", lease_owner: lease.lease?.owner || null });
    return { processed: 0, pass: 0, fail: 0, blocked: 0 };
  }

  const cycleReceipt = { processed: 0, pass: 0, fail: 0, blocked: 0 };
  try {
    const files = (await readdir(path.join(config.dataDir, "queue", "pending")))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .slice(0, config.concurrency);

    for (const file of files) {
      const result = await processLocalPacket(file);
      cycleReceipt.processed += 1;
      if (result.status === "PASS" || result.status === "IDEMPOTENT") cycleReceipt.pass += 1;
      else if (result.status === "BLOCKED") cycleReceipt.blocked += 1;
      else cycleReceipt.fail += 1;
    }
    return cycleReceipt;
  } finally {
    await releaseLease(lease);
  }
}

async function cycleDurable() {
  const cycleReceipt = { processed: 0, pass: 0, fail: 0, blocked: 0 };
  const reachable = await x1.ping();
  if (!reachable) throw new Error("X1 tenant not reachable");

  const work = await x1.leaseNextWork();
  if (!work) return cycleReceipt;

  const result = await processDurableWork(work);
  cycleReceipt.processed = 1;
  if (result.status === "PASS") cycleReceipt.pass = 1;
  else if (result.status === "BLOCKED") cycleReceipt.blocked = 1;
  else cycleReceipt.fail = 1;
  return cycleReceipt;
}

async function cycle() {
  const started = Date.now();
  const cycleReceipt = x1 ? await cycleDurable() : await cycleLocal();
  const watch = await monitor();
  if (!watch.ok) cycleReceipt.fail += 1;

  lastCycle = {
    ...cycleReceipt,
    watch,
    duration_ms: Date.now() - started,
    completed_at: new Date().toISOString(),
  };

  await emitAll({
    receipt_id: "heartbeat-" + Date.now(),
    status: cycleReceipt.fail ? "FAIL" : "PASS",
    kind: "reconcile_cycle",
    ...lastCycle,
  });
  await heartbeat({ state: cycleReceipt.fail ? "degraded" : "healthy", last_cycle: lastCycle });
}

function publicConfig() {
  return {
    projectId: config.projectId,
    sourceSha: config.sourceSha,
    dataDir: config.dataDir,
    workspace: config.workspace,
    httpPort: config.httpPort,
    pollMs: config.pollMs,
    leaseMs: config.leaseMs,
    concurrency: config.concurrency,
    watchUrls: config.watchUrls,
    receiptUrl: config.receiptUrl,
    receiptToken: config.receiptToken ? "[configured]" : "",
    x1: {
      enabled: config.x1.enabled,
      supabaseUrl: config.x1.supabaseUrl,
      tenantId: config.x1.tenantId,
      agentId: config.x1.agentId,
      environment: config.x1.environment,
      leaseTtlSeconds: config.x1.leaseTtlSeconds,
      serviceRoleKey: config.x1.serviceRoleKey ? "[configured]" : "",
    },
  };
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET") { res.writeHead(405); return res.end(); }
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      project_id: config.projectId,
      source_sha: config.sourceSha,
      durable_backend: x1 ? "x1_supabase" : "local_filesystem",
    }));
  }
  if (req.url === "/readyz") {
    const fresh = lastHeartbeat && (Date.now() - new Date(lastHeartbeat.timestamp).getTime() < config.pollMs * 2 + 60000);
    const ready = Boolean(fresh && lastHeartbeat?.state !== "degraded");
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ready, heartbeat: lastHeartbeat }));
  }
  if (req.url === "/status") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ config: publicConfig(), lastHeartbeat, lastCycle }));
  }
  res.writeHead(404); res.end();
});

await ensureRuntimeDirs(config.dataDir);
await heartbeat({ state: "starting" });
server.listen(config.httpPort, "0.0.0.0", () => {
  console.log(JSON.stringify({
    event: "super_agent_started",
    project_id: config.projectId,
    port: config.httpPort,
    source_sha: config.sourceSha,
    durable_backend: x1 ? "x1_supabase" : "local_filesystem",
  }));
});

const loop = async () => {
  if (shuttingDown) return;
  await cycle().catch(async (error) => {
    await emitAll({
      receipt_id: "cycle-error-" + Date.now(),
      status: "FAIL",
      kind: "runtime_error",
      error: String(error.message || error),
    }).catch(() => {});
    await heartbeat({ state: "degraded", error: String(error.message || error) });
  });
  if (!shuttingDown) setTimeout(loop, config.pollMs).unref();
};
await loop();

for (const signal of ["SIGTERM","SIGINT"]) {
  process.on(signal, async () => {
    shuttingDown = true;
    await emitAll({
      receipt_id: "runtime-stop-" + Date.now(),
      status: "PASS",
      kind: "runtime_lifecycle",
      signal,
    }).catch(() => {});
    await heartbeat({ state: "stopping", signal }).catch(() => {});
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
