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

const urlList = (value = "") =>
  String(value).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 25);

const x1Environment = (value) => {
  const candidate = String(value || "preview").toLowerCase();
  return ["development","preview","production"].includes(candidate) ? candidate : "preview";
};

export function runtimeConfig(env = process.env) {
  const x1Url = String(env.X1_SUPABASE_URL || "").replace(/\/$/, "");
  const x1Key = String(env.X1_SUPABASE_SERVICE_ROLE_KEY || "");
  const x1TenantId = String(env.X1_TENANT_ID || "");

  return Object.freeze({
    projectId: env.AGENT_PROJECT_ID || "BNM-EA-V1",
    sourceSha: env.AGENT_SOURCE_SHA || "unknown",
    dataDir: env.AGENT_DATA_DIR || "/data",
    workspace: env.AGENT_WORKSPACE || "/workspace",
    httpPort: integer(env.PORT || env.AGENT_HTTP_PORT, 8787, 1024, 65535),
    pollMs: integer(env.AGENT_POLL_MS, 300000, 10000, 3600000),
    leaseMs: integer(env.AGENT_LEASE_MS, 420000, 30000, 3600000),
    concurrency: integer(env.AGENT_CONCURRENCY, 1, 1, 4),
    watchUrls: urlList(env.AGENT_WATCH_URLS),
    receiptUrl: env.CONTROL_PLANE_RECEIPT_URL || "",
    receiptToken: env.CONTROL_PLANE_TOKEN || "",
    x1: Object.freeze({
      enabled: Boolean(x1Url && x1Key && x1TenantId),
      supabaseUrl: x1Url,
      serviceRoleKey: x1Key,
      tenantId: x1TenantId,
      agentId: env.X1_AGENT_ID || "bnm-super-agent",
      environment: x1Environment(env.X1_ENVIRONMENT),
      leaseTtlSeconds: integer(env.X1_LEASE_TTL_SECONDS, 300, 30, 600),
    }),
  });
}
