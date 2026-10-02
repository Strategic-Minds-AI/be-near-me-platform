/**
 * Repair Engine
 * Targeted recursive repair: classify failure → identify smallest component →
 * patch only target → rerun failed validator → run regression → record receipt.
 * Per 10_VALIDATION_MESH.md: Do not rebuild unrelated working portions.
 */

// ── Classify which validation layer failed ──
export function classifyFailure(receipt) {
  if (!receipt || receipt.status !== 'FAIL') {
    return null;
  }

  return {
    validator_id: receipt.validator_id,
    layer: getLayerForValidator(receipt.validator_id),
    failures: receipt.failures || [],
    evidence: receipt.evidence || [],
  };
}

// ── Get the validation layer number for a validator ──
function getLayerForValidator(validatorId) {
  const layers = {
    schema: 1, completeness: 2,
    lint: 3, typecheck: 3, compile: 3,
    unit_test: 4, integration_test: 5, e2e: 6,
    visual_regression: 7, accessibility: 8,
    security_scan: 9, dependency_scan: 9, secret_scan: 9,
    data_integrity: 10, artifact_integrity: 11,
    backend_parity: 12, acceptance_criteria: 13,
  };
  return layers[validatorId] || 0;
}

// ── Create a repair task from a failed receipt ──
export function createRepairTask(receipt, runId, targetStepKey, repairRound = 1) {
  const classification = classifyFailure(receipt);
  if (!classification) {
    return null;
  }

  return {
    run_id: runId,
    validation_receipt_id: receipt.id || null,
    target_step_key: targetStepKey,
    status: 'open',
    failure_layer: classification.validator_id,
    repair_spec: {
      validator_id: classification.validator_id,
      layer: classification.layer,
      failures: classification.failures,
      strategy: getRepairStrategy(classification.validator_id, classification.failures),
    },
    repair_round: repairRound,
    created_at: new Date().toISOString(),
  };
}

// ── Get repair strategy for a validator ──
function getRepairStrategy(validatorId, failures) {
  const strategies = {
    schema: 'Regenerate the failing output with corrected schema compliance. Target only the fields that failed validation.',
    completeness: 'Remove TODO/FIXME/stub markers and implement the missing behavior in the identified component only.',
    lint: 'Apply lint fixes to the specific files that failed. Do not reformat unrelated files.',
    typecheck: 'Fix type errors in the specific files that failed. Do not add type suppressions.',
    compile: 'Fix build errors in the specific files that failed. Do not modify working build configuration.',
    unit_test: 'Fix the failing test or the code it tests. Do not modify passing tests.',
    integration_test: 'Fix the failing integration test or the integration point it covers.',
    e2e: 'Fix the failing E2E scenario or the UI flow it covers.',
    visual_regression: 'Fix the visual diff in the specific component that changed.',
    accessibility: 'Fix the accessibility issue in the specific component that failed.',
    security_scan: 'Fix the security vulnerability in the specific dependency or code that was flagged.',
    dependency_scan: 'Update or replace the vulnerable dependency.',
    secret_scan: 'Remove the leaked secret from the output and rotate it if it was real.',
    data_integrity: 'Fix the data relationship or constraint that was violated.',
    artifact_integrity: 'Recompute the missing or invalid checksum and update the manifest.',
    backend_parity: 'Align the frontend contract with the backend implementation.',
    acceptance_criteria: 'Fix the specific acceptance criterion that was not met.',
  };

  return strategies[validatorId] || 'Fix the identified failure in the smallest responsible component.';
}

// ── Determine if a repair should be attempted ──
export function shouldRepair(receipt, repairPolicy) {
  if (!receipt || receipt.status !== 'FAIL') return false;

  const maxRounds = repairPolicy?.max_rounds || 5;
  const currentRound = repairPolicy?.current_round || 0;

  if (currentRound >= maxRounds) {
    return { shouldRepair: false, reason: `Max repair rounds (${maxRounds}) reached` };
  }

  // Some failures are not repairable (e.g. missing required input)
  const nonRepairable = ['schema']; // schema failures on input are not repairable
  if (nonRepairable.includes(receipt.validator_id) && receipt.failures?.some(f => f.path?.startsWith('input'))) {
    return { shouldRepair: false, reason: 'Input schema failure — cannot repair, must fix input' };
  }

  return { shouldRepair: true };
}

// ── Create a regression test plan after repair ──
export function createRegressionPlan(repairTask, allValidators) {
  return {
    primary_validator: repairTask.failure_layer,
    regression_validators: allValidators.filter(v => v !== repairTask.failure_layer),
    repair_round: repairTask.repair_round,
  };
}

// ── Check if all repairs are complete ──
export function allRepairsComplete(repairTasks) {
  if (!Array.isArray(repairTasks) || repairTasks.length === 0) return true;
  return repairTasks.every(t => t.status === 'completed' || t.status === 'skipped');
}

// ── Get the max repair round from a list of repair tasks ──
export function getMaxRepairRound(repairTasks) {
  if (!Array.isArray(repairTasks) || repairTasks.length === 0) return 0;
  return Math.max(...repairTasks.map(t => t.repair_round || 0));
}