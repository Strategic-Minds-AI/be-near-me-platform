import assert from "node:assert/strict";
import { X1Store, mapX1ActionClass, packetFromX1Lease } from "../ops/super-agent/x1-store.mjs";

const fixture = {
  work_id: "11111111-1111-1111-1111-111111111111",
  work_packet_id: "wp-bnm-1",
  task_id: "bnm-runtime-snapshot",
  tenant_id: "666f23bf-61bd-4be0-b5cb-4872e04fad9b",
  requested_by: "ci",
  action_class: "READ_ONLY",
  payload: {
    project_id: "BNM-EA-V1",
    task_type: "runtime_snapshot",
    params: {},
    timeout_ms: 15000,
  },
  source_sha: "ci-sha",
  idempotency_key: "bnm-ci-durable-1",
  attempt: 1,
  lease: {
    leaseId: "lease-ci-1",
    taskId: "bnm-runtime-snapshot",
    holderAgentId: "bnm-super-agent-ci",
  },
};

const config = {
  projectId: "BNM-EA-V1",
  sourceSha: "ci-sha",
  x1: {
    enabled: true,
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "test-only-not-a-secret",
    tenantId: fixture.tenant_id,
    agentId: "bnm-super-agent-ci",
    environment: "preview",
    leaseTtlSeconds: 300,
  },
};

assert.equal(mapX1ActionClass("READ_ONLY"), "READ");
assert.equal(mapX1ActionClass("NON_PRODUCTION_MUTATION"), "PREVIEW_WRITE");
assert.equal(mapX1ActionClass("PROTECTED_MUTATION"), "PROTECTED");
assert.equal(mapX1ActionClass("PRODUCTION_RELEASE"), "PROTECTED");

const packet = packetFromX1Lease(fixture, config);
assert.equal(packet.project_id, "BNM-EA-V1");
assert.equal(packet.task_type, "runtime_snapshot");
assert.equal(packet.action_class, "READ");
assert.equal(packet.x1.lease_id, "lease-ci-1");

const calls = [];
const fetchImpl = async (url, options = {}) => {
  calls.push({ url: String(url), method: options.method || "GET", body: options.body ? JSON.parse(options.body) : null });

  if (String(url).includes("/x1_tenants?")) {
    return new Response(JSON.stringify([{ tenant_id: fixture.tenant_id }]), { status: 200 });
  }
  if (String(url).endsWith("/rpc/x1_lease_next_work")) {
    return new Response(JSON.stringify(fixture), { status: 200 });
  }
  if (String(url).endsWith("/rpc/x1_claim_execution")) {
    return new Response(JSON.stringify("22222222-2222-2222-2222-222222222222"), { status: 200 });
  }
  if (String(url).endsWith("/rpc/x1_heartbeat_apex_lease")) {
    return new Response(JSON.stringify(true), { status: 200 });
  }
  if (String(url).includes("/rest/v1/x1_audit_receipts")) {
    return new Response("", { status: 201 });
  }
  return new Response(null, { status: 204 });
};

const store = new X1Store(config, { fetchImpl });
assert.equal(await store.ping(), true);
const leased = await store.leaseNextWork();
const durablePacket = packetFromX1Lease(leased, config);
const executionId = await store.claimExecution(leased, durablePacket);
assert.equal(executionId, "22222222-2222-2222-2222-222222222222");
assert.equal(await store.heartbeatLease(durablePacket), true);

await store.emitReceipt({
  receipt_id: "ci-receipt",
  kind: "work_packet",
  status: "PASS",
  project_id: "BNM-EA-V1",
});
await store.completeExecution(executionId, "ci-receipt");
await store.finishWork(durablePacket, "COMPLETED");

assert(calls.some((call) => call.url.endsWith("/rpc/x1_lease_next_work")));
assert(calls.some((call) => call.url.endsWith("/rpc/x1_claim_execution")));
assert(calls.some((call) => call.url.includes("/x1_audit_receipts")));

console.log(JSON.stringify({
  ok: true,
  adapter: "x1_supabase",
  calls: calls.length,
  action_mapping: {
    READ_ONLY: "READ",
    NON_PRODUCTION_MUTATION: "PREVIEW_WRITE",
    PROTECTED_MUTATION: "PROTECTED",
    PRODUCTION_RELEASE: "PROTECTED",
  },
}));
