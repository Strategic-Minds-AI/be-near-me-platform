export const ACTION_CLASSES = Object.freeze({
  READ: "READ",
  DRAFT: "DRAFT",
  BRANCH_WRITE: "BRANCH_WRITE",
  PREVIEW_WRITE: "PREVIEW_WRITE",
  PROTECTED: "PROTECTED",
});

export const AUTO_CLASSES = new Set([
  ACTION_CLASSES.READ,
  ACTION_CLASSES.DRAFT,
  ACTION_CLASSES.BRANCH_WRITE,
  ACTION_CLASSES.PREVIEW_WRITE,
]);

const integer = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
};

export function runtimeConfig(env = process.env) {
  return Object.freeze({
    projectId: env.AGENT_PROJECT_ID || "BNM-EA-V1",
    sourceSha: env.AGENT_SOURCE_SHA || "unknown",
    dataDir: env.AGENT_DATA_DIR || "/data",
    workspace: env.AGENT_WORKSPACE || "/workspace",
    httpPort: integer(env.PORT || env.AGENT_HTTP_PORT, 8787, 1024, 65535),
    pollMs: integer(env.AGENT_POLL_MS, 300000, 10000, 3600000),
    leaseMs: integer(env.AGENT_LEASE_MS, 420000, 30000, 3600000),
    concurrency: integer(env.AGENT_CONCURRENCY, 1, 1, 4),
    receiptUrl: env.CONTROL_PLANE_RECEIPT_URL || "",
    receiptToken: env.CONTROL_PLANE_TOKEN || "",
  });
}
