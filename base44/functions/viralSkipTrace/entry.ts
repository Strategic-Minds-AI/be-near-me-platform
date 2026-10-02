import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";

// viralSkipTrace — the "skip trace" system that finds top creators across
// social media (via free YouTube search + oEmbed), reverse-engineers their
// video styles including VISUAL DNA (colors, fonts, effects, symbols, outlines,
// patterns, transitions), and classifies them into 10 distinct viral templates.
//
// Powered by Vercel AI Gateway (no Base44 integration credits required).
// YouTube oEmbed + search HTML parsing are free public endpoints.
//
// Input: { refresh?: boolean }
// Output: { discovered, templates, styles }

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

// 10 broad search queries — each surfaces a different viral video FORMAT
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

async function getVideoIds(query: string): Promise<string[]> {
  try {
    const r = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
    );
    const html = await r.text();
    return [...new Set([...html.matchAll(YT_ID_RE)].map((m) => m[1]))].slice(0, 6);
  } catch {
    return [];
  }
}

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

    // 1. Discover top creators/videos across the 10 format queries (parallelized)
    const idLists = await Promise.all(STYLE_QUERIES.map((q) => getVideoIds(q)));
    const allIds = idLists.flatMap((ids, i) => ids.map((id) => ({ id, q: STYLE_QUERIES[i] })));
    const metas = await Promise.all(allIds.map((x) => getMeta(x.id)));
    const discovered: { title: string; channel: string; query: string }[] = [];
    allIds.forEach((x, i) => {
      if (metas[i]) {
        discovered.push({ title: metas[i].title, channel: metas[i].author_name, query: x.q });
      }
    });

    if (discovered.length === 0) {
      return Response.json({ error: 'No videos discovered from YouTube' }, { status: 502 });
    }

    // 2. Classify into 10 distinct viral styles with FULL VISUAL DNA via LLM
    const classifyPrompt = `You are an expert viral content analyst and visual designer. Below is a dataset of real trending videos discovered across YouTube, grouped by the search query that surfaced them. Your job is to identify the TOP 10 DISTINCT VIRAL VIDEO STYLES that top creators use — each style is a repeatable FORMAT/pattern (not a topic).

For EACH style, you must identify the COMPLETE VISUAL DNA that top creators use:
- Color palette: the exact hex colors they gravitate toward (backgrounds, text, accents, overlays)
- Font/typography style: font family, weight, case, treatment (outlines, shadows, gradients)
- Visual effects: editing techniques (speed ramps, match cuts, zoom punches, glitch, etc.)
- Text overlay style: how on-screen text is styled and placed (outline color, stroke, animation)
- Symbols & motifs: recurring visual symbols, stickers, emojis, or graphic elements
- Transition style: how shots connect (whip pans, hard cuts, cross dissolves, mask transitions)
- Lighting style: the lighting approach that defines the look
- Thumbnail text pattern: how text and faces are arranged on the cover/thumbnail

Base your analysis on the real creators, titles, and the well-known visual conventions of each format. Be specific and actionable — these details will be fed to an AI video generator.

DISCOVERED VIDEOS (title | creator | format query):
${JSON.stringify(discovered, null, 2)}

Return EXACTLY 10 styles as a JSON array. Each style object must have:
- style_name: a catchy name for the style (e.g. "Fast-Cut Transition Reel")
- category: the best-fit content category (one of: gaming, music, vlogs, education, entertainment, sports, news, tech, comedy, film, howto, travel, food, fashion, art, science, pets, autos, other)
- tagline: a one-line summary (max 80 chars)
- description: what this style is and why it goes viral (2-3 sentences)
- hook_pattern: the opening 1-2 second hook structure
- pacing: edit rhythm and cut frequency
- shot_list: 4-6 typical shots in sequence
- music_style: audio/music approach
- caption_formula: on-screen text/caption structure
- example_creators: 2-4 real creator names from the dataset (or well-known ones) who use this style
- example_video_titles: 2-3 example titles in this style
- viral_prompt_template: a fill-in prompt a user would feed to an AI video generator to make a video in this style — include a {USER_IDEA} placeholder
- visual_prompt_template: a cinematic visual prompt template for AI video generation (vertical 9:16), with a {USER_IDEA} placeholder, describing lighting, camera movement, mood, color palette, and effects
- thumbnail_style: thumbnail/cover visual approach
- avg_duration: typical duration in seconds (6 or 8)
- difficulty: beginner | intermediate | advanced
- color_palette: array of 4-6 hex color codes (e.g. "#FF006E") that define this style's look
- font_style: typography description (family, weight, case, treatment)
- visual_effects: array of 3-5 specific editing techniques/effects used
- text_overlay_style: on-screen text treatment (outline, shadow, placement, animation)
- symbols_motifs: array of 2-4 recurring visual symbols, stickers, or graphic elements
- transition_style: how cuts/transitions between shots are executed
- lighting_style: the lighting approach that defines the look
- thumbnail_text_pattern: how text and faces are arranged on the thumbnail`;

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
                color_palette: { type: 'array', items: { type: 'string' } },
                font_style: { type: 'string' },
                visual_effects: { type: 'array', items: { type: 'string' } },
                text_overlay_style: { type: "string" },
                symbols_motifs: { type: "array", items: { type: "string" } },
                transition_style: { type: "string" },
                lighting_style: { type: "string" },
                thumbnail_text_pattern: { type: "string" },
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
      color_palette: s.color_palette || [],
      font_style: s.font_style || '',
      visual_effects: s.visual_effects || [],
      text_overlay_style: s.text_overlay_style || '',
      symbols_motifs: s.symbols_motifs || [],
      transition_style: s.transition_style || '',
      aspect_ratio: '9:16',
      lighting_style: s.lighting_style || '',
      thumbnail_text_pattern: s.thumbnail_text_pattern || '',
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