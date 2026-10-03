import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureRuntimeDirs(dataDir) {
  const dirs = [
    "queue/pending","queue/working","queue/done","queue/blocked","queue/dead-letter",
    "receipts","state"
  ];
  await Promise.all(dirs.map((dir) => mkdir(path.join(dataDir, dir), { recursive: true })));
}

export function safeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}

export function hash(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

export async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = file + "." + process.pid + "." + randomUUID() + ".tmp";
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(temp, file);
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function acquireLease(dataDir, leaseMs) {
  const file = path.join(dataDir, "state", "supervisor.lease.json");
  const now = Date.now();
  try {
    const handle = await open(file, "wx", 0o600);
    const lease = { owner: process.pid, acquired_at: new Date(now).toISOString(), expires_at: new Date(now + leaseMs).toISOString() };
    await handle.writeFile(JSON.stringify(lease, null, 2) + "\n");
    await handle.close();
    return { ok: true, file, lease };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    try {
      const existing = await readJson(file);
      if (new Date(existing.expires_at).getTime() > now) return { ok: false, file, lease: existing };
      await rm(file, { force: true });
      return acquireLease(dataDir, leaseMs);
    } catch {
      const info = await stat(file).catch(() => null);
      if (info && now - info.mtimeMs < leaseMs) return { ok: false, file, lease: null };
      await rm(file, { force: true });
      return acquireLease(dataDir, leaseMs);
    }
  }
}

export async function releaseLease(lease) {
  if (lease?.ok && lease.file) await rm(lease.file, { force: true });
}

export async function emitReceipt(config, receipt) {
  const full = {
    receipt_version: "BNM-SUPER-AGENT-1",
    project_id: config.projectId,
    source_sha: config.sourceSha,
    emitted_at: new Date().toISOString(),
    ...receipt,
  };
  const id = safeFileName(full.receipt_id || full.idempotency_key || randomUUID());
  await atomicJson(path.join(config.dataDir, "receipts", id + ".json"), full);

  if (config.receiptUrl) {
    const headers = { "content-type": "application/json" };
    if (config.receiptToken) headers.authorization = "Bearer " + config.receiptToken;
    try {
      await fetch(config.receiptUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(full),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // Durable local receipt remains authoritative when the optional bridge is unavailable.
    }
  }
  return full;
}
