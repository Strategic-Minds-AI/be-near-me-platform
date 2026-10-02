// cloudBrowserSkipTrace — uses the Xtreme Cloud Browser engine to discover trending
// videos across YouTube with stealth (anti-bot bypass, CAPTCHA solving, full JS render),
// extracts richer metadata than simple fetch allows, classifies them into 10 viral style
// templates via Vercel AI Gateway, and upserts into ViralTemplate.
//
// Powered by the Railway Cloud Browser engine + Vercel AI Gateway (no Base44 credits).
//
// Input: { refresh?: boolean }
// Output: { discovered, templates, styles, source }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from "base44:runtime";
import { cloudBrowser, CloudBrowserError } from "../../shared/cloudBrowser.ts";
import { chatCompletion } from "../../shared/vercelAiGateway.ts";

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

const STYLE_QUERIES = [
  "viral transition reel tiktok 2026",
  "storytime vlog storytelling",
  "aesthetic day in the life",
  "fast cut tutorial how to",
  "reaction video trend",
  "challenge trend viral",
  "transformation before after",
  "listicle countdown top 5",
  "behind the scenes process",
  "trend remix mashup edit",
];

// Extract video IDs from a YouTube search results page using the cloud browser.
// Uses extract_html + regex parse because the engine's extract_attribute returns
// only the first match, while extract_html gives us the full rendered DOM.
async function extractVideoIdsFromSearch(sessionId: string, query: string): Promise<string[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    await cloudBrowser.execute(sessionId, {
      action_type: "goto",
      value: url,
      options: { waitUntil: "networkidle", timeout: 20000 },
    });
    const result = await cloudBrowser.execute(sessionId, {
      action_type: "extract_html",
      selector: "body",
      options: {},
    });
    const html: string = String(result?.data || "");
    const ids = new Set<string>();
    for (const match of html.matchAll(YT_ID_RE)) {
      ids.add(match[1]);
    }
    return [...ids].slice(0, 4);
  } catch {
    return [];
  }
}

// Fetch oEmbed metadata for a single video (fast, no browser needed).
async function getMeta(id: string) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Use cloud browser to discover video IDs (stealth, anti-bot bypass)
    const discovered: { title: string; channel: string; query: string }[] = [];

    await cloudBrowser.withSession(async (sessionId) => {
      // Process queries in small batches to stay within timeout
      for (let i = 0; i < STYLE_QUERIES.length; i += 2) {
        const batch = STYLE_QUERIES.slice(i, i + 2);
        const idLists = await Promise.all(batch.map((q) => extractVideoIdsFromSearch(sessionId, q)));
        const allIds = idLists.flatMap((ids, j) => ids.map((id) => ({ id, q: batch[j] })));
        const metas = await Promise.all(allIds.map((x) => getMeta(x.id)));
        allIds.forEach((x, k) => {
          if (metas[k]) {
            discovered.push({ title: metas[k].title, channel: metas[k].author_name, query: x.q });
          }
        });
      }
    }, { recordVideo: false });

    if (discovered.length === 0) {
      return Response.json({ error: 'No videos discovered via cloud browser' }, { status: 502 });
    }

    // 2. Classify into 10 distinct viral styles via Vercel AI Gateway
    const classifyPrompt = `You are a viral content analyst. Below is a dataset of real trending videos discovered via stealth browser. Identify the TOP 10 DISTINCT VIRAL VIDEO STYLES — each a repeatable FORMAT/pattern (not a topic). Each style must be genuinely different in structure.

DISCOVERED VIDEOS (title | creator | query):
${JSON.stringify(discovered)}

Return EXACTLY 10 styles as JSON. Each must have:
- style_name, category (gaming|music|vlogs|education|entertainment|sports|news|tech|comedy|film|howto|travel|food|fashion|art|science|pets|autos|other), tagline (max 80 chars), description (2-3 sentences)
- hook_pattern, pacing, shot_list (4-6 shots), music_style, caption_formula
- example_creators (2-4 names), example_video_titles (2-3)
- viral_prompt_template (with {USER_IDEA} placeholder), visual_prompt_template (vertical 9:16, with {USER_IDEA}), thumbnail_style
- avg_duration (6 or 8), difficulty (beginner|intermediate|advanced)`;

    const styles = await chatCompletion(classifyPrompt, {
      model: 'gemini_3_flash',
      jsonSchema: {
        type: 'object',
        properties: {
          styles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                style_name: { type: 'string' },
                category: { type: 'string' },
                tagline: { type: 'string' },
                description: { type: 'string' },
                hook_pattern: { type: 'string' },
                pacing: { type: 'string' },
                shot_list: { type: 'array', items: { type: 'string' } },
                music_style: { type: 'string' },
                caption_formula: { type: 'string' },
                example_creators: { type: 'array', items: { type: 'string' } },
                example_video_titles: { type: 'array', items: { type: 'string' } },
                viral_prompt_template: { type: 'string' },
                visual_prompt_template: { type: 'string' },
                thumbnail_style: { type: 'string' },
                avg_duration: { type: 'number' },
                difficulty: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const styleList = styles.styles || [];

    // 3. Upsert each style into ViralTemplate
    const now = new Date().toISOString();
    const records = styleList.map((s: any) => ({
      style_name: s.style_name,
      slug: slugify(s.style_name),
      category: s.category,
      tagline: s.tagline,
      description: s.description,
      hook_pattern: s.hook_pattern,
      pacing: s.pacing,
      shot_list: s.shot_list || [],
      music_style: s.music_style,
      caption_formula: s.caption_formula,
      example_creators: s.example_creators || [],
      example_video_titles: s.example_video_titles || [],
      viral_prompt_template: s.viral_prompt_template,
      visual_prompt_template: s.visual_prompt_template,
      thumbnail_style: s.thumbnail_style,
      avg_duration: s.avg_duration || 6,
      difficulty: s.difficulty || 'beginner',
      discovered_at: now,
    }));

    let upserted = 0;
    if (records.length > 0) {
      const res = await base44.entities.ViralTemplate.upsert(records, { key: 'slug' });
      upserted = (res?.records || []).length;
    }

    return Response.json({
      discovered: discovered.length,
      templates: upserted,
      styles: styleList.map((s: any) => s.style_name),
      source: 'cloud-browser',
    });
  } catch (error) {
    const status = error instanceof CloudBrowserError ? error.status : 500;
    return Response.json({ error: error.message, source: 'cloud-browser' }, { status });
  }
}