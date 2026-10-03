import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const SAFE_TASKS = new Set(["http_check","file_check","npm_build","targeted_lint","runtime_snapshot"]);

function run(command, args, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: "1", PUPPETEER_SKIP_DOWNLOAD: "true" },
      stdio: ["ignore","pipe","pipe"],
    });
    let stdout = "";
    let stderr = "";
    const limit = 256000;
    child.stdout.on("data", (d) => { if (stdout.length < limit) stdout += d; });
    child.stderr.on("data", (d) => { if (stderr.length < limit) stderr += d; });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, signal, stdout: stdout.slice(-limit), stderr: stderr.slice(-limit) });
    });
  });
}

function insideWorkspace(workspace, candidate) {
  const resolved = path.resolve(workspace, candidate);
  const root = path.resolve(workspace) + path.sep;
  if (resolved !== path.resolve(workspace) && !resolved.startsWith(root)) throw new Error("Path escapes workspace");
  return resolved;
}

export async function executeTask(packet, config) {
  if (!SAFE_TASKS.has(packet.task_type)) throw new Error("Unsupported task_type");

  if (packet.task_type === "http_check") {
    const urls = Array.isArray(packet.params?.urls) ? packet.params.urls : [];
    if (!urls.length || urls.length > 25) throw new Error("http_check requires 1-25 urls");
    const results = [];
    for (const url of urls) {
      const parsed = new URL(url);
      if (!["http:","https:"].includes(parsed.protocol)) throw new Error("Unsupported URL protocol");
      const response = await fetch(parsed, { redirect: "follow", signal: AbortSignal.timeout(Math.min(packet.timeout_ms || 15000, 30000)) });
      results.push({ url: parsed.toString(), status: response.status, ok: response.ok });
    }
    return { ok: results.every((r) => r.ok), results };
  }

  if (packet.task_type === "file_check") {
    const paths = Array.isArray(packet.params?.paths) ? packet.params.paths : [];
    if (!paths.length || paths.length > 50) throw new Error("file_check requires 1-50 paths");
    const results = [];
    for (const item of paths) {
      const file = insideWorkspace(config.workspace, item);
      try { await access(file); results.push({ path: item, exists: true }); }
      catch { results.push({ path: item, exists: false }); }
    }
    return { ok: results.every((r) => r.exists), results };
  }

  if (packet.task_type === "npm_build") {
    return run("npm", ["run","build"], { cwd: config.workspace, timeoutMs: Math.min(packet.timeout_ms || 240000, 600000) });
  }

  if (packet.task_type === "targeted_lint") {
    const targets = Array.isArray(packet.params?.paths) ? packet.params.paths : [];
    if (!targets.length || targets.length > 80) throw new Error("targeted_lint requires 1-80 paths");
    const safe = targets.map((item) => {
      const resolved = insideWorkspace(config.workspace, item);
      return path.relative(config.workspace, resolved);
    });
    return run("npx", ["eslint", ...safe], { cwd: config.workspace, timeoutMs: Math.min(packet.timeout_ms || 180000, 600000) });
  }

  const pkg = JSON.parse(await readFile(path.join(config.workspace, "package.json"), "utf8"));
  return {
    ok: true,
    project: pkg.name,
    version: pkg.version,
    node: process.version,
    source_sha: config.sourceSha,
    uptime_seconds: Math.round(process.uptime()),
  };
}
