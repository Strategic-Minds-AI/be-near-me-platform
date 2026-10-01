import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const baseline = process.env.FROZEN_BASELINE_SHA;

if (!baseline) {
  console.error("FROZEN_BASELINE_SHA is required.");
  process.exit(2);
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function diagnostics(result) {
  const lines = `${result.stdout || ""}\n${result.stderr || ""}`.split(/\r?\n/);
  const signatures = new Set();

  for (const line of lines) {
    const fileMatch = line.match(/^(.+?)\(\d+,\d+\): error (TS\d+): (.+)$/);
    if (fileMatch) {
      const [, file, code, message] = fileMatch;
      signatures.add(`${file.replaceAll("\\", "/")}|${code}|${message.trim()}`);
      continue;
    }

    const globalMatch = line.match(/^error (TS\d+): (.+)$/);
    if (globalMatch) {
      signatures.add(`GLOBAL|${globalMatch[1]}|${globalMatch[2].trim()}`);
    }
  }

  return signatures;
}

const tsc = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const head = run(tsc, ["-p", "jsconfig.json", "--pretty", "false"], root);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "benearme-type-baseline-"));
const baselineDir = path.join(tempRoot, "repo");

try {
  const add = run("git", ["worktree", "add", "--detach", baselineDir, baseline], root);
  if (add.status !== 0) {
    console.error(add.stderr || add.stdout);
    process.exit(2);
  }

  const baselineNodeModules = path.join(baselineDir, "node_modules");
  fs.symlinkSync(path.join(root, "node_modules"), baselineNodeModules, "dir");

  const baselineTsc = path.join(baselineNodeModules, ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
  const frozen = run(baselineTsc, ["-p", "jsconfig.json", "--pretty", "false"], baselineDir);

  const headSet = diagnostics(head);
  const frozenSet = diagnostics(frozen);
  const introduced = [...headSet].filter((item) => !frozenSet.has(item)).sort();
  const resolved = [...frozenSet].filter((item) => !headSet.has(item)).sort();

  console.log(`Frozen diagnostic signatures: ${frozenSet.size}`);
  console.log(`Head diagnostic signatures:   ${headSet.size}`);
  console.log(`Resolved signatures:          ${resolved.length}`);
  console.log(`New signatures:               ${introduced.length}`);

  if (resolved.length) {
    console.log("\nResolved:");
    for (const item of resolved) console.log(`  - ${item}`);
  }

  if (introduced.length) {
    console.error("\nNew typecheck debt is not allowed:");
    for (const item of introduced) console.error(`  - ${item}`);
    process.exit(1);
  }

  console.log("\nPASS: no new TypeScript diagnostic signatures relative to the frozen baseline.");
} finally {
  try {
    run("git", ["worktree", "remove", "--force", baselineDir], root);
  } catch {}
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
