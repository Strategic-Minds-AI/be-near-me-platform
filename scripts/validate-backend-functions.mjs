import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const functionsRoot = path.join(root, "base44", "functions");
const esbuild = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "esbuild.cmd" : "esbuild");
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "benearme-backend-build-"));
const failures = [];
const entries = fs.readdirSync(functionsRoot, { withFileTypes: true })
  .filter((item) => item.isDirectory())
  .map((item) => path.join(functionsRoot, item.name, "entry.ts"))
  .filter((entry) => fs.existsSync(entry))
  .sort();

for (const entry of entries) {
  const name = path.basename(path.dirname(entry));
  const output = path.join(outDir, `${name}.mjs`);
  const result = spawnSync(esbuild, [
    entry,
    "--bundle",
    "--platform=neutral",
    "--format=esm",
    "--log-level=error",
    "--external:npm:*",
    "--external:base44:*",
    `--outfile=${output}`,
  ], { cwd: root, encoding: "utf8" });

  if (result.status === 0) {
    console.log(`PASS  ${path.relative(root, entry)}`);
  } else {
    failures.push({ entry: path.relative(root, entry), output: `${result.stdout || ""}\n${result.stderr || ""}`.trim() });
    console.error(`FAIL  ${path.relative(root, entry)}`);
  }
}

fs.rmSync(outDir, { recursive: true, force: true });

if (!entries.length) {
  console.error("No Base44 backend function entry.ts files were found.");
  process.exit(2);
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`\n${failure.entry}\n${failure.output}`);
  }
  process.exit(1);
}

console.log(`\nPASS: compiled ${entries.length} Base44 backend functions.`);
