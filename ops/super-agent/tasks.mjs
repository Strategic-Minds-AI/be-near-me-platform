import { access, readFile } from "node:fs/promises";
import path from "node:path";

const SAFE_TASKS = new Set(["http_check","file_check","runtime_snapshot"]);

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
