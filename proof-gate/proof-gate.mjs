import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'proof-gate', 'bnm-proof-gate.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const failures = [];
const passes = [];
const fail = (id, detail) => failures.push({ id, detail });
const pass = (id, detail) => passes.push({ id, detail });

function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail('FILE_MISSING', rel);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

const manifestText = read(cfg.manifest);
let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch {
  fail('MANIFEST_INVALID_JSON', cfg.manifest);
}

if (manifest) {
  if (manifest.visual_lock_id === cfg.visual_lock) pass('VISUAL_LOCK_ID', manifest.visual_lock_id);
  else fail('VISUAL_LOCK_ID', `expected ${cfg.visual_lock}, got ${manifest.visual_lock_id}`);

  if (manifest.status === 'APPROVED') pass('VISUAL_LOCK_APPROVED', 'APPROVED');
  else fail('VISUAL_LOCK_APPROVED', `status=${manifest.status}`);

  const screens = Array.isArray(manifest.screens) ? manifest.screens : [];
  if (screens.length === cfg.required_screen_count) pass('SCREEN_COUNT', String(screens.length));
  else fail('SCREEN_COUNT', `expected ${cfg.required_screen_count}, got ${screens.length}`);

  const names = new Set();
  const hashes = new Set();
  for (const screen of screens) {
    if (!screen?.name) fail('SCREEN_NAME_MISSING', JSON.stringify(screen));
    if (!/^[a-f0-9]{64}$/i.test(screen?.sha256 || '')) fail('SCREEN_HASH_INVALID', screen?.name || 'unknown');
    if (names.has(screen?.name)) fail('DUPLICATE_SCREEN_NAME', screen.name);
    if (hashes.has(screen?.sha256)) fail('DUPLICATE_SCREEN_HASH', screen.name);
    names.add(screen?.name);
    hashes.add(screen?.sha256);
  }
  if (names.size === screens.length) pass('SCREEN_NAMES_UNIQUE', String(names.size));
  if (hashes.size === screens.length) pass('SCREEN_HASHES_UNIQUE', String(hashes.size));

  const score = Number(manifest?.parity?.minimum_score);
  const crit = Number(manifest?.parity?.critical_fails_allowed);
  if (score >= cfg.parity_policy.minimum_score) pass('PARITY_THRESHOLD', String(score));
  else fail('PARITY_THRESHOLD', `expected >= ${cfg.parity_policy.minimum_score}, got ${score}`);
  if (crit === cfg.parity_policy.critical_fails_allowed) pass('CRITICAL_FAIL_POLICY', String(crit));
  else fail('CRITICAL_FAIL_POLICY', `expected ${cfg.parity_policy.critical_fails_allowed}, got ${crit}`);
}

const app = read(cfg.app_file);
for (const item of cfg.required_routes) {
  const routePattern = new RegExp(`path=["']${item.route.replace(/[.*+?^$()|[\\]\\]/g, '\\$&')}["'][^>]*element=\\{<${item.component}\\s*/>\\}`);
  if (routePattern.test(app)) pass('LOCKED_ROUTE', `${item.route} -> ${item.component}`);
  else fail('LOCKED_ROUTE_MISSING', `${item.route} -> ${item.component}`);
}

const legacy = read(cfg.legacy_config_file);
for (const legacyImport of cfg.forbidden_legacy_imports) {
  if (legacy.includes(legacyImport)) fail('LEGACY_ROUTE_SURFACE_PRESENT', legacyImport);
  else pass('LEGACY_ROUTE_SURFACE_ABSENT', legacyImport);
}

const receipt = {
  gate_id: cfg.gate_id,
  visual_lock: cfg.visual_lock,
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  rule: cfg.rule,
  passed: passes.length,
  failed: failures.length,
  passes,
  failures
};

fs.mkdirSync(path.join(root, 'proof-gate', 'receipts'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'proof-gate', 'receipts', 'latest.json'),
  JSON.stringify(receipt, null, 2) + '\n'
);

console.log(JSON.stringify(receipt, null, 2));
if (failures.length) process.exit(1);
