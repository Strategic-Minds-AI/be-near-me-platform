/**
 * Adapter Registry
 * Defines all 10 required adapters with manifests, health checks, and NOT_CONFIGURED handling.
 * Pure logic — no SDK dependencies. SDK-dependent health checks are in backend functions.
 *
 * Per 04_ADAPTER_AND_PLUGIN_SPEC.md:
 * - Each adapter has: adapter_id, version, capabilities, config_schema, actions
 * - Each action has: name, risk_class, idempotent, requires_approval
 * - External writes never silently fall back to fake success
 * - Unconfigured adapters return NOT_CONFIGURED with connection instructions
 */

export const RISK_CLASSES = ['READ', 'DRAFT', 'BRANCH_WRITE', 'PROTECTED'];

// ── Adapter Manifests ──
export const ADAPTER_MANIFESTS = {
  'ai-gateway': {
    adapter_id: 'ai-gateway',
    version: '1.0.0',
    name: 'AI Model Gateway',
    capabilities: ['ai_generate', 'ai_evaluate', 'text_completion', 'structured_output'],
    config_schema: {
      type: 'object',
      required: ['api_key_ref'],
      properties: {
        api_key_ref: { type: 'string', description: 'Secret reference for API key' },
        default_model: { type: 'string', default: 'automatic' },
        max_tokens: { type: 'number', default: 4096 },
      },
    },
    actions: [
      { name: 'generate', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'evaluate', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 60, retryable: true },
      { name: 'structured_generate', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_seconds: 120, retryable: true },
    ],
    secret_references: ['VERCEL_AI_GATEWAY_API_KEY'],
    connection_instructions: 'Set VERCEL_AI_GATEWAY_API_KEY in Secrets. The AI Gateway routes to multiple model providers.',
  },

  'http-api': {
    adapter_id: 'http-api',
    version: '1.0.0',
    name: 'HTTP/API Adapter',
    capabilities: ['http_get', 'http_post', 'http_put', 'http_delete', 'webhook_send'],
    config_schema: {
      type: 'object',
      properties: {
        base_url: { type: 'string' },
        auth_header_ref: { type: 'string' },
        timeout_seconds: { type: 'number', default: 30 },
      },
    },
    actions: [
      { name: 'get', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'post', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'put', risk_class: 'BRANCH_WRITE', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'delete', risk_class: 'PROTECTED', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
    ],
    secret_references: [],
    connection_instructions: 'Configure base_url and optional auth_header_ref in adapter config.',
  },

  'github': {
    adapter_id: 'github',
    version: '1.0.0',
    name: 'GitHub Adapter',
    capabilities: ['repo_create', 'branch_create', 'pr_create', 'file_write', 'branch_protection'],
    config_schema: {
      type: 'object',
      required: ['token_ref'],
      properties: {
        token_ref: { type: 'string', description: 'Secret reference for GitHub token' },
        default_org: { type: 'string' },
      },
    },
    actions: [
      { name: 'read_repo', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'create_branch', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'write_file', risk_class: 'BRANCH_WRITE', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'create_pr', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'set_branch_protection', risk_class: 'PROTECTED', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
    ],
    secret_references: ['GITHUB_TOKEN'],
    connection_instructions: 'Connect GitHub account via OAuth connector or set GITHUB_TOKEN in Secrets.',
  },

  'supabase': {
    adapter_id: 'supabase',
    version: '1.0.0',
    name: 'Supabase Adapter',
    capabilities: ['schema_apply', 'rls_apply', 'storage_config', 'auth_config', 'query_read'],
    config_schema: {
      type: 'object',
      required: ['project_ref', 'service_key_ref'],
      properties: {
        project_ref: { type: 'string' },
        service_key_ref: { type: 'string', description: 'Secret reference for service role key' },
      },
    },
    actions: [
      { name: 'read_table', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'apply_migration', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_seconds: 120, retryable: false },
      { name: 'apply_rls', risk_class: 'PROTECTED', idempotent: true, requires_approval: true, timeout_seconds: 60, retryable: false },
      { name: 'config_storage', risk_class: 'BRANCH_WRITE', idempotent: true, requires_approval: true, timeout_seconds: 60, retryable: false },
    ],
    secret_references: ['SUPABASE_SERVICE_KEY'],
    connection_instructions: 'Connect Supabase via workspace connector or set SUPABASE_SERVICE_KEY and project_ref.',
  },

  'vercel': {
    adapter_id: 'vercel',
    version: '1.0.0',
    name: 'Vercel Adapter',
    capabilities: ['project_create', 'env_set', 'deploy', 'domain_config', 'preview_deploy'],
    config_schema: {
      type: 'object',
      required: ['token_ref'],
      properties: {
        token_ref: { type: 'string', description: 'Secret reference for Vercel token' },
        default_team: { type: 'string' },
      },
    },
    actions: [
      { name: 'read_project', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'create_project', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'set_env', risk_class: 'BRANCH_WRITE', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'deploy', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_seconds: 300, retryable: false },
      { name: 'config_domain', risk_class: 'PROTECTED', idempotent: true, requires_approval: true, timeout_seconds: 60, retryable: false },
    ],
    secret_references: ['VERCEL_TOKEN'],
    connection_instructions: 'Set VERCEL_TOKEN in Secrets.',
  },

  'railway': {
    adapter_id: 'railway',
    version: '1.0.0',
    name: 'Railway Adapter',
    capabilities: ['service_create', 'env_set', 'deploy', 'sandbox_execute'],
    config_schema: {
      type: 'object',
      required: ['token_ref'],
      properties: {
        token_ref: { type: 'string', description: 'Secret reference for Railway token' },
      },
    },
    actions: [
      { name: 'read_service', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'create_service', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 60, retryable: false },
      { name: 'set_env', risk_class: 'BRANCH_WRITE', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'deploy', risk_class: 'PROTECTED', idempotent: false, requires_approval: true, timeout_seconds: 300, retryable: false },
    ],
    secret_references: ['RAILWAY_TOKEN'],
    connection_instructions: 'Set RAILWAY_TOKEN in Secrets.',
  },

  'google-drive': {
    adapter_id: 'google-drive',
    version: '1.0.0',
    name: 'Google Drive Adapter',
    capabilities: ['folder_create', 'file_upload', 'file_share', 'file_read'],
    config_schema: {
      type: 'object',
      required: ['connector_id'],
      properties: {
        connector_id: { type: 'string', description: 'Workspace connector ID' },
      },
    },
    actions: [
      { name: 'read_file', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'create_folder', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
      { name: 'upload_file', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 60, retryable: false },
      { name: 'share_file', risk_class: 'PROTECTED', idempotent: true, requires_approval: true, timeout_seconds: 30, retryable: false },
    ],
    secret_references: [],
    connection_instructions: 'Connect Google Drive via workspace connector.',
  },

  'base44-internal': {
    adapter_id: 'base44-internal',
    version: '1.0.0',
    name: 'Base44 Internal Adapter',
    capabilities: ['entity_read', 'entity_write', 'function_invoke', 'workflow_trigger'],
    config_schema: {
      type: 'object',
      properties: {
        app_id: { type: 'string' },
      },
    },
    actions: [
      { name: 'entity_read', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'entity_write', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: false, timeout_seconds: 30, retryable: true },
      { name: 'function_invoke', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'workflow_trigger', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 30, retryable: false },
    ],
    secret_references: [],
    connection_instructions: 'Always available — uses the Base44 SDK.',
  },

  'sandbox': {
    adapter_id: 'sandbox',
    version: '1.0.0',
    name: 'Sandbox Code Execution Adapter',
    capabilities: ['code_execute', 'test_run', 'lint', 'typecheck', 'build'],
    config_schema: {
      type: 'object',
      required: ['engine_url', 'engine_key_ref'],
      properties: {
        engine_url: { type: 'string', description: 'Sandbox engine URL' },
        engine_key_ref: { type: 'string', description: 'Secret reference for engine API key' },
        cpu_limit: { type: 'number', default: 1 },
        memory_limit_mb: { type: 'number', default: 512 },
        timeout_seconds: { type: 'number', default: 60 },
        network_policy: { type: 'string', enum: ['denied', 'allowlisted', 'open'], default: 'denied' },
      },
    },
    actions: [
      { name: 'execute', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_seconds: 120, retryable: false },
      { name: 'run_tests', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 120, retryable: false },
      { name: 'lint', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 60, retryable: true },
      { name: 'typecheck', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 60, retryable: true },
      { name: 'build', risk_class: 'DRAFT', idempotent: true, requires_approval: false, timeout_seconds: 180, retryable: false },
    ],
    secret_references: ['CLOUD_BROWSER_ENGINE_KEY'],
    connection_instructions: 'Set CLOUD_BROWSER_ENGINE_URL and CLOUD_BROWSER_ENGINE_KEY in Secrets.',
  },

  'file-archive': {
    adapter_id: 'file-archive',
    version: '1.0.0',
    name: 'File/Archive Adapter',
    capabilities: ['zip_create', 'zip_extract', 'file_upload', 'file_download', 'checksum'],
    config_schema: {
      type: 'object',
      properties: {
        storage_mode: { type: 'string', enum: ['private', 'public'], default: 'private' },
      },
    },
    actions: [
      { name: 'zip', risk_class: 'DRAFT', idempotent: true, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'unzip', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'upload_private', risk_class: 'DRAFT', idempotent: false, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'upload_public', risk_class: 'BRANCH_WRITE', idempotent: false, requires_approval: true, timeout_seconds: 120, retryable: true },
      { name: 'download', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 120, retryable: true },
      { name: 'checksum', risk_class: 'READ', idempotent: true, requires_approval: false, timeout_seconds: 30, retryable: true },
    ],
    secret_references: [],
    connection_instructions: 'Always available — uses Base44 file storage.',
  },
};

// ── Get an adapter manifest by key ──
export function getAdapter(adapterKey) {
  return ADAPTER_MANIFESTS[adapterKey] || null;
}

// ── Get all adapter keys ──
export function getAllAdapterKeys() {
  return Object.keys(ADAPTER_MANIFESTS);
}

// ── Get an action from an adapter ──
export function getAction(adapterKey, actionName) {
  const adapter = getAdapter(adapterKey);
  if (!adapter) return null;
  return adapter.actions.find(a => a.name === actionName) || null;
}

// ── Get risk class for an action ──
export function getRiskClass(adapterKey, actionName) {
  const action = getAction(adapterKey, actionName);
  return action ? action.risk_class : null;
}

// ── Check if an action requires approval ──
export function requiresApproval(adapterKey, actionName) {
  const action = getAction(adapterKey, actionName);
  return action ? action.requires_approval : false;
}

// ── Check if an action is idempotent ──
export function isIdempotent(adapterKey, actionName) {
  const action = getAction(adapterKey, actionName);
  return action ? action.idempotent : false;
}

// ── Check adapter health (pure logic — actual connectivity check is in backend) ──
// Returns NOT_CONFIGURED result if secrets are missing.
export function checkAdapterHealth(adapterKey, availableSecrets = []) {
  const adapter = getAdapter(adapterKey);
  if (!adapter) {
    return {
      adapter_key: adapterKey,
      health_status: 'error',
      health_message: `Unknown adapter: ${adapterKey}`,
      configured: false,
    };
  }

  const missingSecrets = (adapter.secret_references || []).filter(
    ref => !availableSecrets.includes(ref)
  );

  if (missingSecrets.length > 0) {
    return {
      adapter_key: adapterKey,
      health_status: 'not_configured',
      health_message: `NOT_CONFIGURED — missing secrets: ${missingSecrets.join(', ')}. ${adapter.connection_instructions}`,
      configured: false,
      missing_secrets: missingSecrets,
      connection_instructions: adapter.connection_instructions,
    };
  }

  return {
    adapter_key: adapterKey,
    health_status: 'healthy',
    health_message: 'All required configuration present',
    configured: true,
  };
}

// ── Create a NOT_CONFIGURED error result ──
export function notConfiguredResult(adapterKey, missingSecrets, connectionInstructions) {
  return {
    status: 'NOT_CONFIGURED',
    adapter_key: adapterKey,
    missing_secrets: missingSecrets,
    connection_instructions: connectionInstructions,
    message: `Adapter ${adapterKey} is not configured. Required: ${missingSecrets.join(', ')}`,
  };
}

// ── Validate adapter action input ──
export function validateActionInput(adapterKey, actionName, input) {
  const adapter = getAdapter(adapterKey);
  if (!adapter) return { valid: false, errors: [`Unknown adapter: ${adapterKey}`] };
  const action = getAction(adapterKey, actionName);
  if (!action) return { valid: false, errors: [`Unknown action: ${actionName} on adapter ${adapterKey}`] };
  return { valid: true, errors: [] };
}