import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";
import { sanitizePrompt, checkRateLimit } from "../../shared/aiSecurity.ts";

// generateMediaKit — AI-powered influencer media kit generator.
// Uses Vercel AI Gateway (not Base44 Core) to avoid integration credit limits.
// Accepts creator details, returns structured JSON media kit with audience charts.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(user.id, "generateMediaKit");
    if (!rl.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({})) || {};
    const { name, niche, platform, followers, ageRange, experience } = body;
    if (!name || !niche || !platform || !followers) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const safeName = sanitizePrompt(name);
    const safeNiche = sanitizePrompt(niche);
    const safePlatform = sanitizePrompt(platform);
    const safeFollowers = sanitizePrompt(String(followers));
    const safeAgeRange = ageRange ? sanitizePrompt(ageRange) : "Not specified";
    const safeExperience = experience ? sanitizePrompt(experience) : "Not specified";

    const prompt = `Generate a professional influencer media kit for the following creator. Return a JSON object with these exact keys:
- profile: A short professional bio paragraph
- audience: Audience overview paragraph including demographics
- platform_stats: Platform statistics and engagement rates paragraph
- collaboration: Brand collaboration experience and highlights paragraph
- packages: Partnership packages with pricing tiers (3 tiers) paragraph
- contact: Professional contact section paragraph
- chart_data: An object with "age_distribution" (array of {range, value} where range is age ranges like "13-17", "18-24", etc. and value is percentage) and "gender_distribution" (array of {name, value} where name is "Female", "Male", "Other" and value is percentage)

Creator details:
Name: ${safeName}
Niche: ${safeNiche}
Main Platform: ${safePlatform}
Followers: ${safeFollowers}
Audience Age Range: ${safeAgeRange}
Brand Collaboration Experience: ${safeExperience}

Make it professional, compelling, and detailed. Write as if it's a real media kit that would impress brands.`;

    const jsonSchema = {
      type: "object",
      properties: {
        profile: { type: "string" },
        audience: { type: "string" },
        platform_stats: { type: "string" },
        collaboration: { type: "string" },
        packages: { type: "string" },
        contact: { type: "string" },
        chart_data: {
          type: "object",
          properties: {
            age_distribution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  range: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
            gender_distribution: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
        },
      },
    };

    const result = await chatCompletion(prompt, { jsonSchema });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}