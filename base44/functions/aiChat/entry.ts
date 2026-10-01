import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";
import { sanitizePrompt, checkRateLimit } from "../../shared/aiSecurity.ts";

// aiChat — proxy for frontend LLM calls via Vercel AI Gateway.
// Replaces direct base44.integrations.Core.InvokeLLM calls from the client,
// removing the dependency on Base44 integration credits.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(user.id, "aiChat");
    if (!rl.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({})) || {};
    const { prompt, model, jsonSchema, images, webSearch } = body;
    if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

    const safePrompt = sanitizePrompt(prompt);
    if (!safePrompt) return Response.json({ error: "Invalid prompt" }, { status: 400 });

    const result = await chatCompletion(safePrompt, { model, jsonSchema, images, webSearch });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}