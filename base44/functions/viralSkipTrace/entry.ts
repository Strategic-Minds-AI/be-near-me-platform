import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";
import { discoverVideos, slugify } from "../../shared/youtubeDiscovery.ts";

// viralSkipTrace — discovers top creators across YouTube (free search + oEmbed),
// classifies them into 10 viral style templates with basic fields, and saves them.
// Visual DNA enrichment is handled separately by enrichVisualDna to keep this
// function fast enough to complete within timeout.
//
// Powered by Vercel AI Gateway (no Base44 integration credits required).
//
// Input: { refresh?: boolean }
// Output: { discovered, templates, styles }

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

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Discover top creators/videos (parallelized)
    const discovered = await discoverVideos(STYLE_QUERIES, 4);

    if (discovered.length === 0) {
      return Response.json({ error: 'No videos discovered from YouTube' }, { status: 502 });
    }

    // 2. Classify into 10 distinct viral styles (basic fields only — fast)
    const classifyPrompt = `You are a viral content analyst. Below is a dataset of real trending videos from YouTube. Identify the TOP 10 DISTINCT VIRAL VIDEO STYLES — each a repeatable FORMAT/pattern (not a topic). Each style must be genuinely different in structure.

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

    // 3. Upsert each style into ViralTemplate (keyed by slug)
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}