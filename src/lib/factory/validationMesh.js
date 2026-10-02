/**
 * Validation Mesh
 * Independent validators that inspect generator outputs.
 * Per 10_VALIDATION_MESH.md: No implementer self-certifies release readiness.
 * Outputs PASS / FAIL / BLOCKED with evidence.
 */

export const VALIDATOR_IDS = [
  'schema', 'completeness', 'lint', 'typecheck', 'compile',
  'unit_test', 'integration_test', 'e2e', 'visual_regression', 'accessibility',
  'security_scan', 'dependency_scan', 'secret_scan',
  'data_integrity', 'artifact_integrity', 'backend_parity', 'acceptance_criteria',
];

export const VALIDATION_STATUSES = ['PASS', 'FAIL', 'BLOCKED'];

export const VALIDATORS = {
  schema: { id: 'schema', name: 'Schema Validation', layer: 1, mandatory: true },
  completeness: { id: 'completeness', name: 'Completeness Check', layer: 2, mandatory: true },
  lint: { id: 'lint', name: 'Lint', layer: 3, mandatory: true },
  typecheck: { id: 'typecheck', name: 'Type Check', layer: 3, mandatory: false },
  compile: { id: 'compile', name: 'Compile/Build', layer: 3, mandatory: true },
  unit_test: { id: 'unit_test', name: 'Unit Tests', layer: 4, mandatory: true },
  integration_test: { id: 'integration_test', name: 'Integration Tests', layer: 5, mandatory: false },
  e2e: { id: 'e2e', name: 'E2E Tests', layer: 6, mandatory: false },
  visual_regression: { id: 'visual_regression', name: 'Visual Regression', layer: 7, mandatory: false },
  accessibility: { id: 'accessibility', name: 'Accessibility', layer: 8, mandatory: false },
  security_scan: { id: 'security_scan', name: 'Security Scan', layer: 9, mandatory: true },
  dependency_scan: { id: 'dependency_scan', name: 'Dependency Scan', layer: 9, mandatory: true },
  secret_scan: { id: 'secret_scan', name: 'Secret Scan', layer: 9, mandatory: true },
  data_integrity: { id: 'data_integrity', name: 'Data Integrity', layer: 10, mandatory: true },
  artifact_integrity: { id: 'artifact_integrity', name: 'Artifact Integrity', layer: 11, mandatory: true },
  backend_parity: { id: 'backend_parity', name: 'Backend Parity', layer: 12, mandatory: false },
  acceptance_criteria: { id: 'acceptance_criteria', name: 'Acceptance Criteria', layer: 13, mandatory: true },
};

export function createReceipt(validatorId, status, subjectHash, evidence = [], failures = []) {
  if (!VALIDATION_STATUSES.includes(status)) {
    throw new Error(`Invalid validation status: ${status}. Must be PASS, FAIL, or BLOCKED.`);
  }
  return { validator_id: validatorId, status, subject_hash: subjectHash, evidence, failures, created_at: new Date().toISOString() };
}

export function validateSchema(output, schema) {
  const failures = [];
  const evidence = [];
  if (!schema) return createReceipt('schema', 'PASS', '', [{ message: 'No schema declared — skipped' }]);

  function check(value, sch, path) {
    if (sch.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== sch.type && value !== undefined && value !== null) {
        failures.push({ path, message: `Expected ${sch.type}, got ${actualType}` });
        return;
      }
    }
    if (sch.required && Array.isArray(sch.required) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const field of sch.required) {
        if (!(field in value)) failures.push({ path: `${path}.${field}`, message: 'Missing required field' });
      }
    }
    if (sch.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [key, subSchema] of Object.entries(sch.properties)) {
        if (key in value) check(value[key], subSchema, `${path}.${key}`);
      }
    }
    if (sch.enum && Array.isArray(sch.enum) && !sch.enum.includes(value)) {
      failures.push({ path, message: `Value "${value}" not in enum` });
    }
  }

  check(output, schema, 'output');
  evidence.push({ message: `Checked ${failures.length === 0 ? 'passed' : `${failures.length} failures`} schema constraints` });
  return createReceipt('schema', failures.length === 0 ? 'PASS' : 'FAIL', '', evidence, failures);
}

export function validateCompleteness(content) {
  const failures = [];
  const evidence = [];
  const prohibitedPatterns = [
    { pattern: /TODO/gi, message: 'TODO found — missing behavior' },
    { pattern: /FIXME/gi, message: 'FIXME found — missing behavior' },
    { pattern: /HACK/gi, message: 'HACK placeholder found' },
    { pattern: /NotImplemented/gi, message: 'NotImplemented found' },
    { pattern: /throw\s+new\s+Error\(['"]not implemented['"]\)/gi, message: 'Not implemented error throw' },
  ];
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  for (const { pattern, message } of prohibitedPatterns) {
    const matches = text.match(pattern);
    if (matches) failures.push({ message: `${message} (${matches.length} occurrence(s))` });
  }
  evidence.push({ message: `Scanned ${text.length} characters for prohibited markers` });
  return createReceipt('completeness', failures.length === 0 ? 'PASS' : 'FAIL', '', evidence, failures);
}

export function validateSecretScan(content) {
  const failures = [];
  const evidence = [];
  const secretPatterns = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'OpenAI API key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub token' },
    { pattern: /AKIA[A-Z0-9]{16}/g, name: 'AWS access key' },
    { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g, name: 'Private key' },
  ];
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  for (const { pattern, name } of secretPatterns) {
    const matches = text.match(pattern);
    if (matches) failures.push({ message: `Potential ${name} found (${matches.length} occurrence(s))` });
  }
  evidence.push({ message: `Scanned for ${secretPatterns.length} secret patterns` });
  return createReceipt('secret_scan', failures.length === 0 ? 'PASS' : 'FAIL', '', evidence, failures);
}

export function validateArtifactIntegrity(artifacts) {
  const failures = [];
  const evidence = [];
  for (const artifact of artifacts) {
    if (!artifact.sha256 || !/^[a-f0-9]{64}$/.test(artifact.sha256)) {
      failures.push({ message: `Artifact ${artifact.name || artifact.artifact_id} has invalid or missing SHA-256` });
    }
    if (!artifact.media_type) {
      failures.push({ message: `Artifact ${artifact.name || artifact.artifact_id} missing media_type` });
    }
    evidence.push({ message: `Checked artifact ${artifact.name || artifact.artifact_id}` });
  }
  return createReceipt('artifact_integrity', failures.length === 0 ? 'PASS' : 'FAIL', '', evidence, failures);
}

export function getValidatorsForPolicy(policy) {
  const mandatory = policy?.mandatory || ['schema', 'completeness', 'compile', 'unit_test', 'security_scan', 'secret_scan', 'artifact_integrity', 'acceptance_criteria'];
  const optional = policy?.optional || [];
  return { mandatory, optional: optional.filter(v => !mandatory.includes(v)) };
}