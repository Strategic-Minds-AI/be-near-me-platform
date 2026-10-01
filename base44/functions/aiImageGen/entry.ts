import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateImage } from "../../shared/vercelAiGateway.ts";
import { sanitizePrompt, checkRateLimit } from "../../shared/aiSecurity.ts";

// aiImageGen — proxy for frontend image generation via Vercel AI Gateway.
// Replaces direct base44.integrations.Core.GenerateImage calls from the client,
// removing the dependency on Base44 integration credits.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(user.id, "aiImageGen");
    if (!rl.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({})) || {};
    const { prompt, model } = body;
    if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

    const safePrompt = sanitizePrompt(prompt);
    if (!safePrompt) return Response.json({ error: "Invalid prompt" }, { status: 400 });

    const result = await generateImage(safePrompt, { model });
    return Response.json({ url: result.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}