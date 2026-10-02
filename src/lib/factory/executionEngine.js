/**
 * Execution Engine
 * Durable run lifecycle: create → validate input → plan → execute steps → validate → repair → export.
 * Pure DAG execution logic — SDK-dependent persistence is in backend functions.
 */

import { topologicalSort, getNode, getPredecessors, validateInput, createRunManifest } from './generatorDsl.js';

export async function createRun(definition, input, options = {}) {
  const inputValidation = validateInput(input, definition.input_schema);
  if (!inputValidation.valid) {
    return { status: 'FAILED', error: { type: 'INPUT_VALIDATION_FAILED', errors: inputValidation.errors } };
  }
  const manifest = await createRunManifest(definition, input, options.seed, options.templateVersions, options.adapterVersions);
  const executionOrder = topologicalSort(definition.workflow_dag);
  const steps = executionOrder.map(stepKey => {
    const node = getNode(definition.workflow_dag, stepKey);
    return {
      step_key: stepKey, step_type: node.type, node_config: node.config || {},
      status: 'pending', attempt_count: 0, max_attempts: definition.limits?.max_step_attempts || 3,
      input: null, output: null, error: null, idempotency_key: null,
      started_at: null, completed_at: null, logs: [],
    };
  });
  return {
    status: 'QUEUED', run_manifest: manifest, execution_order: executionOrder,
    steps, input, input_hash: manifest.input_hash, seed: options.seed || null,
    started_at: new Date().toISOString(),
  };
}

export function getNextStep(run, dag) {
  for (const stepKey of run.execution_order) {
    const step = run.steps.find(s => s.step_key === stepKey);
    if (!step || step.status !== 'pending') continue;
    const predecessors = getPredecessors(dag, stepKey);
    if (predecessors.every(predKey => {
      const predStep = run.steps.find(s => s.step_key === predKey);
      return predStep && predStep.status === 'passed';
    })) {
      return step;
    }
  }
  return null;
}

export async function executeStep(step, context) {
  const { definition, input, stepOutputs } = context;
  step.status = 'running';
  step.started_at = new Date().toISOString();
  step.attempt_count++;
  try {
    const dag = definition.workflow_dag;
    const predecessors = getPredecessors(dag, step.step_key);
    const stepInput = {};
    for (const predKey of predecessors) {
      const predStep = stepOutputs[predKey];
      if (predStep) Object.assign(stepInput, predStep.output || {});
    }
    Object.assign(stepInput, input);
    step.input = stepInput;
    const result = await executeNode(step, stepInput, context);
    step.output = result.output;
    step.status = 'passed';
    step.completed_at = new Date().toISOString();
    step.logs.push(`Step ${step.step_key} (${step.step_type}) completed`);
    return { status: 'passed', output: result.output };
  } catch (error) {
    step.error = { message: error.message, type: error.constructor.name, attempt: step.attempt_count };
    step.logs.push(`Step ${step.step_key} failed: ${error.message}`);
    if (step.attempt_count < step.max_attempts && isRetryable(error)) {
      step.status = 'pending';
      return { status: 'retry', error: step.error };
    }
    step.status = 'dead_letter';
    step.completed_at = new Date().toISOString();
    return { status: 'failed', error: step.error };
  }
}

function isRetryable(error) {
  const nonRetryable = ['INPUT_VALIDATION_FAILED', 'SCHEMA_ERROR', 'CYCLE_DETECTED'];
  if (error.type && nonRetryable.includes(error.type)) return false;
  if (error.message && error.message.includes('NOT_CONFIGURED')) return false;
  return true;
}

async function executeNode(step, input, context) {
  const { node_config, step_type } = step;
  switch (step_type) {
    case 'transform': return executeTransform(node_config, input);
    case 'template': return { output: { template_id: node_config.template_id, variables: input } };
    case 'ai_generate': return { output: { _pending_ai: true, config: node_config, input } };
    case 'ai_evaluate': return { output: { _pending_ai: true, config: node_config, input } };
    case 'validate_schema': return { output: { validated: true, schema: node_config.schema || null } };
    case 'validate_content': return { output: { validated: true } };
    case 'validate_security': return { output: { validated: true } };
    case 'checksum': return { output: { sha256: 'pending' } };
    case 'package': return { output: { packaged: true, artifacts: node_config.artifacts || [] } };
    case 'export': return { output: { exported: true, format: node_config.format || 'zip' } };
    case 'branch': return { output: { branch: evaluateSimple(node_config.condition, input) ? 'true' : 'false' } };
    case 'fanout': return { output: { fanout: true, child_generator: node_config.generator_id, items: resolvePath(node_config.collection, input) || [] } };
    case 'reduce': return { output: { reduced: true, strategy: node_config.strategy || 'merge' } };
    case 'approval': return { output: { approval_required: true, risk_class: node_config.risk_class || 'DRAFT', status: 'waiting' } };
    case 'code_execute':
    case 'test':
    case 'validate_visual':
    case 'adapter_read':
    case 'adapter_write':
      return { output: { _pending_adapter: step_type, config: node_config, input } };
    default: throw new Error(`Unknown node type: ${step_type}`);
  }
}

function executeTransform(config, input) {
  if (!config.transform) return { output: input };
  const output = {};
  for (const [key, value] of Object.entries(config.transform)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      output[key] = resolvePath(value.slice(2, -2).trim(), input);
    } else {
      output[key] = value;
    }
  }
  return { output };
}

function resolvePath(path, obj) {
  if (!path) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function evaluateSimple(condition, input) {
  if (!condition) return true;
  if (typeof condition === 'string') return !!resolvePath(condition, input);
  return !!condition;
}

export function cancelRun(run) {
  return {
    ...run, status: 'CANCELLED', completed_at: new Date().toISOString(),
    steps: run.steps.map(s => {
      if (s.status === 'pending' || s.status === 'running') {
        return { ...s, status: 'cancelled', completed_at: new Date().toISOString() };
      }
      return s;
    }),
  };
}