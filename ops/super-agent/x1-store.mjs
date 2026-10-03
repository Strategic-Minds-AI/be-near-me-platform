import { createHash } from "node:crypto";
import { ACTION_CLASSES } from "./config.mjs";

const X1_ACTION_MAP = Object.freeze({
  READ_ONLY: ACTION_CLASSES.READ,
  NON_PRODUCTION_MUTATION: ACTION_CLASSES.PREVIEW_WRITE,
  PROTECTED_MUTATION: ACTION_CLASSES.PROTECTED,
  PRODUCTION_RELEASE: ACTION_CLASSES.PROTECTED,
});

export function mapX1ActionClass(value) {
  return X1_ACTION_MAP[String(value || "")] || null;
}

export function packetFromX1Lease(work, config) {
  if (!work || typeof work !== "object") throw new Error("X1 lease payload missing");
  if (!work.work_id || !work.task_id || !work.idempotency_key || !work.lease?.leaseId) {
    throw new Error("X1 lease payload incomplete");
  }

  const actionClass = mapX1ActionClass(work.action_class);
  if (!actionClass) throw new Error("Unsupported X1 action class");

  const payload = work.payload && typeof work.payload === "object" ? work.payload : {};
  const taskType = String(payload.task_type || "");
  if (!taskType) throw new Error("X1 work payload missing task_type");

  return {
    id: String(work.task_id),
    project_id: String(payload.project_id || config.projectId),
    action_class: actionClass,
    task_type: taskType,
    idempotency_key: String(work.idempotency_key),
    params: payload.params && typeof payload.params === "object" ? payload.params : {},
    max_attempts: 1,
    timeout_ms: Math.max(1000, Math.min(600000, Number(payload.timeout_ms || 60000))),
    source_sha: work.source_sha || null,
    x1: {
      work_id: String(work.work_id),
      work_packet_id: String(work.work_packet_id || ""),
      lease_id: String(work.lease.leaseId),
      attempt: Math.max(1, Number(work.attempt || 1)),
      requested_by: String(work.requested_by || ""),
      original_action_class: String(work.action_class || ""),
      approval_reference: work.approval_reference || null,
      validation_receipt_id: work.validation_receipt_id || null,
      rollback_reference: work.rollback_reference || null,
    },
  };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class X1Store {
  constructor(config, { fetchImpl = globalThis.fetch } = {}) {
    if (!config?.x1?.enabled) throw new Error("X1 durable store is not configured");
    if (typeof fetchImpl !== "function") throw new Error("fetch implementation required");
    this.config = config;
    this.fetch = fetchImpl;
  }

  headers(extra = {}) {
    return {
      apikey: this.config.x1.serviceRoleKey,
      authorization: "Bearer " + this.config.x1.serviceRoleKey,
      "content-type": "application/json",
      ...extra,
    };
  }

  async request(path, { method = "GET", body, prefer } = {}) {
    const headers = this.headers(prefer ? { prefer } : {});
    const response = await this.fetch(this.config.x1.supabaseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error("X1 request failed " + response.status + ": " + text.slice(0, 500));
    }
    return text ? JSON.parse(text) : null;
  }

  rpc(name, body) {
    return this.request("/rest/v1/rpc/" + encodeURIComponent(name), { method: "POST", body });
  }

  async ping() {
    const query = "/rest/v1/x1_tenants?tenant_id=eq." + encodeURIComponent(this.config.x1.tenantId) + "&select=tenant_id&limit=1";
    const rows = await this.request(query);
    return Array.isArray(rows) && rows.length === 1;
  }

  leaseNextWork() {
    return this.rpc("x1_lease_next_work", {
      p_tenant_id: this.config.x1.tenantId,
      p_worker_id: this.config.x1.agentId,
      p_environment: this.config.x1.environment,
      p_ttl_seconds: this.config.x1.leaseTtlSeconds,
    });
  }

  claimExecution(work, packet) {
    const executionKey = packet.idempotency_key + ":attempt:" + packet.x1.attempt;
    return this.rpc("x1_claim_execution", {
      p_task_id: packet.id,
      p_tenant_id: this.config.x1.tenantId,
      p_lease_id: packet.x1.lease_id,
      p_agent_id: this.config.x1.agentId,
      p_idempotency_key: executionKey,
      p_attempt: packet.x1.attempt,
    });
  }

  heartbeatLease(packet) {
    return this.rpc("x1_heartbeat_apex_lease", {
      p_lease_id: packet.x1.lease_id,
      p_agent_id: this.config.x1.agentId,
      p_ttl_seconds: this.config.x1.leaseTtlSeconds,
    });
  }

  completeExecution(executionId, receiptId) {
    return this.rpc("x1_complete_execution", {
      p_execution_id: executionId,
      p_receipt_id: receiptId,
    });
  }

  failExecution(executionId, fingerprint) {
    return this.rpc("x1_fail_execution", {
      p_execution_id: executionId,
      p_failure_fingerprint: fingerprint,
    });
  }

  finishWork(packet, status, errorCode = null) {
    return this.rpc("x1_finish_work", {
      p_work_id: packet.x1.work_id,
      p_lease_id: packet.x1.lease_id,
      p_status: status,
      p_error_code: errorCode,
    });
  }

  async emitReceipt(receipt) {
    const row = {
      tenant_id: this.config.x1.tenantId,
      receipt_type: String(receipt.kind || "super_agent"),
      receipt_id: String(receipt.receipt_id),
      source_system: "bnm-super-agent",
      source_sha: this.config.sourceSha === "unknown" ? null : this.config.sourceSha,
      content_hash: digest(receipt),
      payload: receipt,
    };
    await this.request("/rest/v1/x1_audit_receipts", {
      method: "POST",
      body: row,
      prefer: "return=minimal",
    });
    return row.receipt_id;
  }
}
