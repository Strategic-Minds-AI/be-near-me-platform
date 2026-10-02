/**
 * Provisioning Planner
 * Plan-first, approval-gated provisioning per 07_PROVISIONING_ENGINE.md.
 * Every plan includes: desired state, current state, diff, actions, risk, credentials, rollback.
 *
 * 30 provisioning templates from registry/provisioning_templates.json.
 * Live execution is always operator-gated.
 */

// ── Provisioning Template Definitions ──
export const PROVISIONING_TEMPLATES = {
  'new-client': { id: 'new-client', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'workspace' },
  'new-project': { id: 'new-project', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'workspace' },
  'new-saas-tenant': { id: 'new-saas-tenant', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'workspace' },
  'new-brand': { id: 'new-brand', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'workspace' },
  'new-location': { id: 'new-location', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'workspace' },
  'github-repo': { id: 'github-repo', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'github' },
  'github-branch-policy': { id: 'github-branch-policy', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'github' },
  'vercel-project': { id: 'vercel-project', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'vercel' },
  'vercel-preview': { id: 'vercel-preview', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'vercel' },
  'supabase-project': { id: 'supabase-project', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'supabase' },
  'supabase-schema': { id: 'supabase-schema', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'supabase' },
  'supabase-storage': { id: 'supabase-storage', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'supabase' },
  'supabase-auth': { id: 'supabase-auth', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'supabase' },
  'railway-service': { id: 'railway-service', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'railway' },
  'railway-sandbox': { id: 'railway-sandbox', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'railway' },
  'drive-project-folders': { id: 'drive-project-folders', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'drive' },
  'google-analytics': { id: 'google-analytics', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'analytics' },
  'search-console': { id: 'search-console', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'analytics' },
  'domain-dns-plan': { id: 'domain-dns-plan', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'domain' },
  'ssl-plan': { id: 'ssl-plan', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'domain' },
  'ai-agent': { id: 'ai-agent', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ai' },
  'agent-team': { id: 'agent-team', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ai' },
  'connector-binding': { id: 'connector-binding', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'integration' },
  'rbac-role-set': { id: 'rbac-role-set', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'security' },
  'monitoring': { id: 'monitoring', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
  'logging': { id: 'logging', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
  'backup': { id: 'backup', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
  'rollback': { id: 'rollback', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
  'deprovision': { id: 'deprovision', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
  'ownership-transfer': { id: 'ownership-transfer', version: '1.0.0', mode: 'plan-first', live_execution_requires_approval: true, category: 'ops' },
};

// ── Get a provisioning template by ID ──
export function getTemplate(templateId) {
  return PROVISIONING_TEMPLATES[templateId] || null;
}

// ── Get all provisioning template IDs ──
export function getAllTemplateIds() {
  return Object.keys(PROVISIONING_TEMPLATES);
}

// ── Compute a diff between current and desired state ──
export function computeDiff(currentState, desiredState) {
  const additions = [];
  const modifications = [];
  const removals = [];
  const unchanged = [];

  const allKeys = new Set([
    ...Object.keys(currentState || {}),
    ...Object.keys(desiredState || {}),
  ]);

  for (const key of allKeys) {
    const current = currentState?.[key];
    const desired = desiredState?.[key];

    if (current === undefined && desired !== undefined) {
      additions.push({ key, value: desired });
    } else if (current !== undefined && desired === undefined) {
      removals.push({ key, value: current });
    } else if (JSON.stringify(current) !== JSON.stringify(desired)) {
      modifications.push({ key, current, desired });
    } else {
      unchanged.push({ key, value: current });
    }
  }

  return { additions, modifications, removals, unchanged };
}

// ── Generate actions from a diff ──
export function generateActions(diff, templateId) {
  const actions = [];

  for (const addition of diff.additions) {
    actions.push({
      action_id: `${templateId}.create.${addition.key}`,
      type: 'create',
      key: addition.key,
      value: addition.value,
      risk_class: getActionRiskClass(templateId, 'create'),
      requires_approval: true,
      adapter: getAdapterForTemplate(templateId),
      idempotent: false,
    });
  }

  for (const mod of diff.modifications) {
    actions.push({
      action_id: `${templateId}.update.${mod.key}`,
      type: 'update',
      key: mod.key,
      current: mod.current,
      desired: mod.desired,
      risk_class: getActionRiskClass(templateId, 'update'),
      requires_approval: true,
      adapter: getAdapterForTemplate(templateId),
      idempotent: true,
    });
  }

  for (const removal of diff.removals) {
    actions.push({
      action_id: `${templateId}.delete.${removal.key}`,
      type: 'delete',
      key: removal.key,
      value: removal.value,
      risk_class: 'PROTECTED',
      requires_approval: true,
      adapter: getAdapterForTemplate(templateId),
      idempotent: true,
    });
  }

  return actions;
}

// ── Generate a rollback plan from actions ──
export function generateRollback(actions) {
  return actions.map(action => {
    if (action.type === 'create') {
      return {
        action_id: `rollback.${action.action_id}`,
        type: 'delete',
        key: action.key,
        depends_on: action.action_id,
      };
    }
    if (action.type === 'update') {
      return {
        action_id: `rollback.${action.action_id}`,
        type: 'update',
        key: action.key,
        value: action.current,
        depends_on: action.action_id,
      };
    }
    if (action.type === 'delete') {
      return {
        action_id: `rollback.${action.action_id}`,
        type: 'create',
        key: action.key,
        value: action.value,
        depends_on: action.action_id,
      };
    }
    return null;
  }).filter(Boolean).reverse(); // Reverse order for rollback
}

// ── Generate a full provisioning plan ──
export function generatePlan(templateId, desiredState, currentState = {}, credentialRequirements = []) {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown provisioning template: ${templateId}`);
  }

  const diff = computeDiff(currentState, desiredState);
  const actions = generateActions(diff, templateId);
  const rollback = generateRollback(actions);

  const riskSummary = {
    total_actions: actions.length,
    protected_actions: actions.filter(a => a.risk_class === 'PROTECTED').length,
    branch_write_actions: actions.filter(a => a.risk_class === 'BRANCH_WRITE').length,
    requires_live_approval: template.live_execution_requires_approval,
    highest_risk: actions.length === 0 ? 'NONE' : actions.some(a => a.risk_class === 'PROTECTED') ? 'PROTECTED' : 'BRANCH_WRITE',
  };

  return {
    plan_id: `${templateId}-${Date.now()}`,
    template_id: templateId,
    template_version: template.version,
    mode: template.mode,
    desired_state: desiredState,
    current_state: currentState,
    diff,
    actions,
    risk_summary: riskSummary,
    credential_requirements: credentialRequirements,
    rollback,
    created_at: new Date().toISOString(),
  };
}

// ── Get the adapter for a provisioning template ──
function getAdapterForTemplate(templateId) {
  const adapterMap = {
    'github-repo': 'github', 'github-branch-policy': 'github',
    'vercel-project': 'vercel', 'vercel-preview': 'vercel',
    'supabase-project': 'supabase', 'supabase-schema': 'supabase',
    'supabase-storage': 'supabase', 'supabase-auth': 'supabase',
    'railway-service': 'railway', 'railway-sandbox': 'railway',
    'drive-project-folders': 'google-drive',
    'domain-dns-plan': 'http-api',
    'ai-agent': 'base44-internal', 'agent-team': 'base44-internal',
    'connector-binding': 'base44-internal',
    'rbac-role-set': 'base44-internal',
    'monitoring': 'base44-internal', 'logging': 'base44-internal',
    'backup': 'file-archive',
  };
  return adapterMap[templateId] || 'base44-internal';
}

// ── Get risk class for an action type ──
function getActionRiskClass(templateId, actionType) {
  if (actionType === 'create') return 'BRANCH_WRITE';
  if (actionType === 'update') return 'BRANCH_WRITE';
  if (actionType === 'delete') return 'PROTECTED';
  return 'DRAFT';
}

// ── Get credential requirements for a template ──
export function getCredentialRequirements(templateId) {
  const template = getTemplate(templateId);
  if (!template) return [];

  const credMap = {
    'github-repo': [{ secret_ref: 'GITHUB_TOKEN', adapter: 'github', description: 'GitHub personal access token' }],
    'github-branch-policy': [{ secret_ref: 'GITHUB_TOKEN', adapter: 'github', description: 'GitHub personal access token' }],
    'vercel-project': [{ secret_ref: 'VERCEL_TOKEN', adapter: 'vercel', description: 'Vercel API token' }],
    'vercel-preview': [{ secret_ref: 'VERCEL_TOKEN', adapter: 'vercel', description: 'Vercel API token' }],
    'supabase-project': [{ secret_ref: 'SUPABASE_SERVICE_KEY', adapter: 'supabase', description: 'Supabase service role key' }],
    'supabase-schema': [{ secret_ref: 'SUPABASE_SERVICE_KEY', adapter: 'supabase', description: 'Supabase service role key' }],
    'supabase-storage': [{ secret_ref: 'SUPABASE_SERVICE_KEY', adapter: 'supabase', description: 'Supabase service role key' }],
    'supabase-auth': [{ secret_ref: 'SUPABASE_SERVICE_KEY', adapter: 'supabase', description: 'Supabase service role key' }],
    'railway-service': [{ secret_ref: 'RAILWAY_TOKEN', adapter: 'railway', description: 'Railway API token' }],
    'railway-sandbox': [{ secret_ref: 'RAILWAY_TOKEN', adapter: 'railway', description: 'Railway API token' }],
    'domain-dns-plan': [{ secret_ref: 'GODADDY_API_KEY', adapter: 'http-api', description: 'GoDaddy API key' }],
  };

  return credMap[templateId] || [];
}