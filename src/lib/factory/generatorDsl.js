/**
 * GeneratorDefinition DSL Compiler
 * Validates generator definitions, compiles DAGs, and creates immutable run manifests.
 * Pure logic — no SDK dependencies. Usable from both frontend and backend.
 */

// ── Node Types (per 03_GENERATOR_DSL_SPEC.md) ──
export const NODE_TYPES = [
  'transform',
  'template',
  'ai_generate',
  'ai_evaluate',
  'code_execute',
  'test',
  'validate_schema',
  'validate_content',
  'validate_security',
  'validate_visual',
  'adapter_read',
  'adapter_write',
  'approval',
  'branch',
  'fanout',
  'reduce',
  'package',
  'checksum',
  'export',
];

export const RUN_STATUSES = [
  'DRAFT', 'VALIDATING_INPUT', 'PLANNING', 'WAITING_APPROVAL',
  'QUEUED', 'RUNNING', 'VALIDATING', 'REPAIRING',
  'PASSED', 'FAILED', 'BLOCKED', 'CANCELLED', 'EXPORTED',
];

export const STEP_STATUSES = [
  'pending', 'running', 'passed', 'failed', 'blocked', 'cancelled', 'dead_letter', 'waiting_approval',
];

// ── Required fields in a GeneratorDefinition ──
const REQUIRED_FIELDS = [
  'id', 'name', 'version', 'input_schema', 'output_contract',
  'workflow_dag', 'validation_policy', 'security_policy',
];

// ── Validate a GeneratorDefinition against the DSL spec ──
export function validateDefinition(def) {
  const errors = [];
  const warnings = [];

  if (!def || typeof def !== 'object') {
    return { valid: false, errors: ['Definition must be an object'], warnings: [] };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in def)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate id pattern
  if (def.id && !/^[a-z0-9][a-z0-9._-]+$/.test(def.id)) {
    errors.push('id must match pattern ^[a-z0-9][a-z0-9._-]+$');
  }

  // Validate version (semver)
  if (def.version && !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(def.version)) {
    errors.push('version must be semver (x.y.z)');
  }

  // Validate DAG
  if (def.workflow_dag) {
    const dagResult = validateDag(def.workflow_dag);
    if (!dagResult.valid) {
      errors.push(...dagResult.errors);
    }
    warnings.push(...dagResult.warnings);
  }

  // Validate input_schema is an object
  if (def.input_schema && typeof def.input_schema !== 'object') {
    errors.push('input_schema must be an object');
  }

  // Validate output_contract is an object
  if (def.output_contract && typeof def.output_contract !== 'object') {
    errors.push('output_contract must be an object');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Validate DAG structure ──
export function validateDag(dag) {
  const errors = [];
  const warnings = [];

  if (!dag || typeof dag !== 'object') {
    return { valid: false, errors: ['DAG must be an object'], warnings: [] };
  }

  if (!Array.isArray(dag.nodes)) {
    errors.push('DAG must have a nodes array');
    return { valid: false, errors, warnings: [] };
  }

  if (!Array.isArray(dag.edges)) {
    errors.push('DAG must have an edges array');
    return { valid: false, errors, warnings: [] };
  }

  const nodeIds = new Set();
  for (const node of dag.nodes) {
    if (!node.id) {
      errors.push('Every node must have an id');
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);

    if (!node.type) {
      errors.push(`Node ${node.id} missing type`);
    } else if (!NODE_TYPES.includes(node.type)) {
      errors.push(`Node ${node.id} has invalid type: ${node.type}`);
    }
  }

  // Validate edges reference existing nodes
  for (const edge of dag.edges) {
    if (!edge.from || !edge.to) {
      errors.push('Every edge must have from and to');
      continue;
    }
    if (!nodeIds.has(edge.from)) {
      errors.push(`Edge references unknown node: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`Edge references unknown node: ${edge.to}`);
    }
  }

  // Check for cycles
  const cycleResult = detectCycles(dag);
  if (cycleResult.hasCycle) {
    errors.push(`DAG contains a cycle: ${cycleResult.cycle.join(' → ')}`);
  }

  // Warn about disconnected nodes
  const connectedNodes = new Set();
  for (const edge of dag.edges) {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  }
  for (const nodeId of nodeIds) {
    if (!connectedNodes.has(nodeId) && dag.nodes.length > 1) {
      warnings.push(`Node ${nodeId} is disconnected`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Detect cycles using DFS ──
function detectCycles(dag) {
  const adj = {};
  for (const node of dag.nodes) adj[node.id] = [];
  for (const edge of dag.edges) {
    if (adj[edge.from]) adj[edge.from].push(edge.to);
  }

  const visited = new Set();
  const recursionStack = new Set();
  const cyclePath = [];

  function dfs(node) {
    visited.add(node);
    recursionStack.add(node);
    cyclePath.push(node);

    for (const neighbor of adj[node] || []) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = cyclePath.indexOf(neighbor);
        return { hasCycle: true, cycle: [...cyclePath.slice(cycleStart), neighbor] };
      }
    }

    recursionStack.delete(node);
    cyclePath.pop();
    return null;
  }

  for (const node of dag.nodes) {
    if (!visited.has(node.id)) {
      const result = dfs(node.id);
      if (result) return result;
    }
  }

  return { hasCycle: false, cycle: [] };
}

// ── Topological sort (returns execution order) ──
export function topologicalSort(dag) {
  const adj = {};
  const inDegree = {};
  for (const node of dag.nodes) {
    adj[node.id] = [];
    inDegree[node.id] = 0;
  }
  for (const edge of dag.edges) {
    if (adj[edge.from]) adj[edge.from].push(edge.to);
    if (inDegree[edge.to] !== undefined) inDegree[edge.to]++;
  }

  const queue = dag.nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
  const order = [];

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of adj[node] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  if (order.length !== dag.nodes.length) {
    throw new Error('DAG contains a cycle — cannot topologically sort');
  }

  return order;
}

// ── Get node by id ──
export function getNode(dag, nodeId) {
  return dag.nodes.find(n => n.id === nodeId);
}

// ── Get predecessors of a node ──
export function getPredecessors(dag, nodeId) {
  return dag.edges.filter(e => e.to === nodeId).map(e => e.from);
}

// ── Get successors of a node ──
export function getSuccessors(dag, nodeId) {
  return dag.edges.filter(e => e.from === nodeId).map(e => e.to);
}

// ── Validate input against a JSON Schema (basic) ──
export function validateInput(input, schema) {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  function check(value, sch, path) {
    if (sch.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== sch.type && value !== undefined && value !== null) {
        errors.push(`${path}: expected ${sch.type}, got ${actualType}`);
        return;
      }
    }
    if (sch.required && Array.isArray(sch.required) && typeof value === 'object' && value !== null) {
      for (const field of sch.required) {
        if (!(field in value)) {
          errors.push(`${path}: missing required field ${field}`);
        }
      }
    }
    if (sch.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [key, subSchema] of Object.entries(sch.properties)) {
        if (key in value) check(value[key], subSchema, `${path}.${key}`);
      }
    }
    if (sch.enum && Array.isArray(sch.enum) && !sch.enum.includes(value)) {
      errors.push(`${path}: value "${value}" not in enum [${sch.enum.join(', ')}]`);
    }
  }

  check(input, schema, 'input');
  return { valid: errors.length === 0, errors };
}

// ── Compute SHA-256 of a string (using Web Crypto API) ──
export async function computeSha256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Canonicalize a definition for hashing (sorted keys) ──
export function canonicalize(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

// ── Create an immutable RunManifest ──
export async function createRunManifest(definition, input, seed, templateVersions, adapterVersions) {
  const inputHash = await computeSha256(canonicalize(input));
  const definitionHash = await computeSha256(canonicalize(definition));
  return {
    run_manifest_version: '1.0.0',
    generator_id: definition.id,
    generator_version: definition.version,
    definition_sha256: definitionHash,
    input_hash: inputHash,
    seed: seed || null,
    template_versions: templateVersions || {},
    adapter_versions: adapterVersions || {},
    model_policy_version: definition.model_policy?._version || '1.0.0',
    created_at: new Date().toISOString(),
  };
}

// ── Get all adapter keys referenced in a DAG ──
export function getReferencedAdapters(dag) {
  const keys = new Set();
  for (const node of dag.nodes) {
    if ((node.type === 'adapter_read' || node.type === 'adapter_write') && node.config?.adapter_key) {
      keys.add(node.config.adapter_key);
    }
  }
  return Array.from(keys);
}

// ── Get all template IDs referenced in a DAG ──
export function getReferencedTemplates(dag) {
  const ids = new Set();
  for (const node of dag.nodes) {
    if (node.type === 'template' && node.config?.template_id) {
      ids.add(node.config.template_id);
    }
  }
  return Array.from(ids);
}

// ── Get all child generator IDs referenced (compose) ──
export function getReferencedChildGenerators(dag) {
  const ids = new Set();
  for (const node of dag.nodes) {
    if ((node.type === 'fanout' || node.type === 'reduce') && node.config?.generator_id) {
      ids.add(node.config.generator_id);
    }
  }
  return Array.from(ids);
}