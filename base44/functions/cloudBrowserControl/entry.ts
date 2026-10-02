// cloudBrowserControl — general-purpose browser control function for in-app agents
// and the MCP server. Exposes the Xtreme Cloud Browser engine's capabilities as a
// single backend function that agents can invoke for on-demand browser automation:
// navigate, extract, click, fill, screenshot, crawl, and observe.
//
// Input:
//   action: "navigate" | "extract" | "observe" | "execute" | "screenshot" | "health"
//   url: string (for navigate)
//   selector: string (for extract/execute)
//   mode: "text" | "html" | "attribute" | "table" | "json" (for extract)
//   attribute: string (for extract mode=attribute)
//   engine_action: string (for execute — raw engine action_type)
//   value: any (for execute — raw engine value)
//   options: object (for execute — raw engine options)
//
// Output: { ok, data, url, title } or { ok: false, error }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cloudBrowser, CloudBrowserError } from "../../shared/cloudBrowser.ts";

const ACTION_MAP: Record<string, string> = {
  text: "extract_text",
  html: "extract_html",
  attribute: "extract_attribute",
  table: "extract_table",
  json: "extract_json",
};

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action = "health" } = body;

    // Health check — no session needed
    if (action === "health") {
      const health = await cloudBrowser.health();
      return Response.json({ ok: true, data: health });
    }

    // All other actions require a browser session
    return await cloudBrowser.withSession(async (sessionId) => {
      let result: any;

      // If a url is provided for observe/extract/screenshot, navigate first within the same session
      const navUrl = body.url;
      const navWaitUntil = body.wait_until;
      const navTimeout = body.timeout_ms;
      if (navUrl && action !== "navigate" && action !== "execute") {
        await cloudBrowser.execute(sessionId, {
          action_type: "goto",
          value: navUrl,
          options: {
            ...(navWaitUntil ? { waitUntil: navWaitUntil } : {}),
            ...(navTimeout ? { timeout: navTimeout } : {}),
          },
        });
      }

      if (action === "navigate") {
        const { url, wait_until, timeout_ms } = body;
        if (!url) return Response.json({ ok: false, error: "url required" }, { status: 400 });
        result = await cloudBrowser.execute(sessionId, {
          action_type: "goto",
          value: url,
          options: {
            ...(wait_until ? { waitUntil: wait_until } : {}),
            ...(timeout_ms ? { timeout: timeout_ms } : {}),
          },
        });
      } else if (action === "observe") {
        const { max_chars = 20000 } = body;
        const extractResult = await cloudBrowser.execute(sessionId, {
          action_type: "extract_text",
          selector: "body",
          options: {},
        });
        const status = await cloudBrowser.status(sessionId);
        const rawText = String(extractResult?.data || "");
        result = {
          url: extractResult?.url || status?.url,
          title: extractResult?.title || status?.title,
          text: rawText.slice(0, max_chars),
          truncated: rawText.length > max_chars,
        };
      } else if (action === "extract") {
        const { mode = "text", selector, attribute } = body;
        if (!selector) return Response.json({ ok: false, error: "selector required" }, { status: 400 });
        const engineAction = ACTION_MAP[mode];
        if (!engineAction) return Response.json({ ok: false, error: `unknown mode: ${mode}` }, { status: 400 });
        result = await cloudBrowser.execute(sessionId, {
          action_type: engineAction,
          selector,
          options: attribute ? { attribute } : {},
        });
      } else if (action === "screenshot") {
        result = await cloudBrowser.screenshot(sessionId);
      } else if (action === "execute") {
        const { engine_action, selector, value, options = {} } = body;
        if (!engine_action) return Response.json({ ok: false, error: "engine_action required" }, { status: 400 });
        result = await cloudBrowser.execute(sessionId, {
          action_type: engine_action,
          ...(selector !== undefined ? { selector } : {}),
          ...(value !== undefined ? { value } : {}),
          options,
        });
      } else {
        return Response.json({ ok: false, error: `unknown action: ${action}` }, { status: 400 });
      }

      return Response.json({ ok: true, data: result, session_id: sessionId });
    }, { recordVideo: false });
  } catch (error) {
    const status = error instanceof CloudBrowserError ? error.status : 500;
    return Response.json({ ok: false, error: error.message }, { status });
  }
}