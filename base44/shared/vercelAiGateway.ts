// Shared helper for Vercel AI Gateway — replaces Base44 Core integrations
// (InvokeLLM, GenerateImage, GenerateVideo) with direct Vercel AI Gateway calls.
// Uses VERCEL_AI_GATEWAY_API_KEY secret for authentication.
// This removes the dependency on Base44 integration credits.

import { secrets } from "base44:runtime";

const GATEWAY_BASE = "https://ai-gateway.vercel.sh/v1";

function getApiKey() {
  const key = secrets.get("VERCEL_AI_GATEWAY_API_KEY");
  if (!key) throw new Error("VERCEL_AI_GATEWAY_API_KEY secret not set");
  return key;
}

// Map Base44 model names to Vercel AI Gateway model IDs
const MODEL_MAP = {
  claude_opus_5: "anthropic/claude-opus-5",
  claude_opus_5_5: "anthropic/claude-opus-5",
  "claude-sonnet-5": "anthropic/claude-sonnet-5",
  gemini_3_flash: "google/gemini-2.5-flash",
  gpt_5_mini: "openai/gpt-4o-mini",
  gpt_6_luna: "openai/gpt-4o",
  automatic: "anthropic/claude-opus-5",
};

function resolveModel(model) {
  if (!model || model === "automatic") return "anthropic/claude-opus-5";
  return MODEL_MAP[model] || model;
}

/**
 * Chat completion — replaces base44.integrations.Core.InvokeLLM
 * @param {string} prompt - The text prompt
 * @param {object} opts - Options
 * @param {string} opts.model - Base44 model name or Vercel AI Gateway model ID
 * @param {object} opts.jsonSchema - JSON schema for structured output
 * @param {string[]} opts.images - Array of image URLs or base64 data URLs (vision)
 * @param {boolean} opts.webSearch - Use a model that supports web search
 * @returns {string|object} Text response or parsed JSON object
 */
export async function chatCompletion(prompt, opts = {}) {
  const model = opts.webSearch
    ? "google/gemini-2.5-flash"
    : resolveModel(opts.model);

  const messageContent = [];

  // Add images (vision) — supports both URLs and base64 data URLs
  if (opts.images && opts.images.length > 0) {
    for (const img of opts.images) {
      messageContent.push({
        type: "image_url",
        image_url: { url: img },
      });
    }
  }

  // Add text prompt
  messageContent.push({ type: "text", text: prompt });

  const body = {
    model,
    messages: [{ role: "user", content: messageContent }],
  };

  // Use JSON schema response format if provided
  if (opts.jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema: opts.jsonSchema,
        strict: false,
      },
    };
  }

  const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway chat error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const responseText = data.choices?.[0]?.message?.content || "";

  if (opts.jsonSchema) {
    // Try to parse JSON from the response
    try {
      return JSON.parse(responseText);
    } catch {
      // Extract JSON from text (model may wrap it in markdown code blocks)
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error(
        "Failed to parse JSON from AI response: " + responseText.slice(0, 200)
      );
    }
  }

  return responseText;
}

/**
 * Generate image — replaces base44.integrations.Core.GenerateImage
 * @param {string} prompt - Image generation prompt
 * @param {object} opts - Options
 * @param {string} opts.model - Vercel AI Gateway model ID
 * @returns {{ url: string }} Object with image URL (or base64 data URL)
 */
export async function generateImage(prompt, opts = {}) {
  const res = await fetch(`${GATEWAY_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model || "openai/gpt-image-2",
      prompt,
      n: 1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway image error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.data?.[0]?.url) return { url: data.data[0].url };
  if (data.data?.[0]?.b64_json) {
    return { url: `data:image/png;base64,${data.data[0].b64_json}` };
  }
  throw new Error("No image URL in response");
}

/**
 * Generate video — replaces base44.integrations.Core.GenerateVideo
 * Uses Vercel AI Gateway's video generation endpoint (Google Veo 3.1).
 * Handles both synchronous and asynchronous (poll-based) responses.
 * @param {string} prompt - Video generation prompt
 * @param {object} opts - Options
 * @param {string} opts.model - Vercel AI Gateway model ID
 * @param {number} opts.duration - Video duration in seconds (4, 6, or 8)
 * @param {string} opts.aspectRatio - Aspect ratio ("16:9" or "9:16")
 * @returns {{ url: string }} Object with video URL
 */
export async function generateVideo(prompt, opts = {}) {
  const model = opts.model || "google/veo-3.1-generate-001";
  const duration = opts.duration || 6;
  const aspectRatio = opts.aspectRatio || "9:16";

  const res = await fetch(`${GATEWAY_BASE}/videos/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, prompt, duration, aspectRatio }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway video error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // If video is ready immediately (synchronous response)
  if (data.videos?.[0]?.url) return { url: data.videos[0].url };

  // If async, poll for status
  const jobId = data.id || data.jobId || data.operationId;
  if (jobId) {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `${GATEWAY_BASE}/videos/generations/${jobId}`,
        { headers: { Authorization: `Bearer ${getApiKey()}` } }
      );
      const statusData = await statusRes.json();
      if (
        statusData.status === "completed" ||
        statusData.status === "succeeded"
      ) {
        if (statusData.videos?.[0]?.url)
          return { url: statusData.videos[0].url };
      }
      if (statusData.status === "failed" || statusData.status === "error") {
        throw new Error(
          `Video generation failed: ${statusData.error || "unknown"}`
        );
      }
    }
    throw new Error("Video generation timed out after 10 minutes");
  }

  throw new Error(
    "Unexpected video response: " + JSON.stringify(data).slice(0, 200)
  );
}