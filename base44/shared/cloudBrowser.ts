// Cloud Browser Engine client — wraps the Xtreme Cloud Browser Railway engine API.
// Uses CLOUD_BROWSER_ENGINE_URL and CLOUD_BROWSER_ENGINE_KEY secrets.
// Engine API: /health, /sessions (POST=start, GET/:id=status, DELETE=:id=end),
//   /sessions/:id/execute, /sessions/:id/screenshot, /sessions/:id/keepalive

import { secrets } from "base44:runtime";

const DEFAULT_TIMEOUT_MS = 60000;

export class CloudBrowserError extends Error {
  status: number;
  body: any;
  constructor(message: string, status = 500, body: any = null) {
    super(message);
    this.name = "CloudBrowserError";
    this.status = status;
    this.body = body;
  }
}

function getEngineConfig() {
  const baseUrl = secrets.get("CLOUD_BROWSER_ENGINE_URL");
  const apiKey = secrets.get("CLOUD_BROWSER_ENGINE_KEY");
  if (!baseUrl) throw new CloudBrowserError("CLOUD_BROWSER_ENGINE_URL secret not set", 500);
  if (!apiKey) throw new CloudBrowserError("CLOUD_BROWSER_ENGINE_KEY secret not set", 500);
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

async function engineRequest(
  path: string,
  opts: { method?: string; body?: any; authenticated?: boolean; timeoutMs?: number } = {}
): Promise<any> {
  const { baseUrl, apiKey } = getEngineConfig();
  const { method = "GET", body, authenticated = true, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (authenticated) headers["x-api-key"] = apiKey;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: any) {
    throw new CloudBrowserError(`Engine request failed: ${error.message}`, 502);
  }

  const raw = await response.text();
  let parsed: any = null;
  if (raw) {
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
  }

  if (!response.ok) {
    const message = parsed?.error || parsed?.message || `Engine HTTP ${response.status}`;
    throw new CloudBrowserError(message, response.status, parsed);
  }
  return parsed ?? {};
}

export const cloudBrowser = {
  health: () => engineRequest("/health", { authenticated: false }),

  start: (options: any = {}) => engineRequest("/sessions", { method: "POST", body: options }),

  status: (sessionId: string) => engineRequest(`/sessions/${encodeURIComponent(sessionId)}`),

  execute: (sessionId: string, action: any) =>
    engineRequest(`/sessions/${encodeURIComponent(sessionId)}/execute`, { method: "POST", body: action }),

  screenshot: (sessionId: string) =>
    engineRequest(`/sessions/${encodeURIComponent(sessionId)}/screenshot`),

  keepalive: (sessionId: string) =>
    engineRequest(`/sessions/${encodeURIComponent(sessionId)}/keepalive`, { method: "POST", body: {} }),

  end: (sessionId: string) =>
    engineRequest(`/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),

  // Helper: run an async fn inside a fresh browser session; always cleans up.
  withSession: async (fn: (sessionId: string) => Promise<any>, options: any = {}) => {
    const session = await cloudBrowser.start(options);
    const sessionId = session.sessionId || session.session_id;
    if (!sessionId) throw new CloudBrowserError("Engine did not return a session id", 502, session);
    try {
      return await fn(sessionId);
    } finally {
      try { await cloudBrowser.end(sessionId); } catch { /* best-effort cleanup */ }
    }
  },
};