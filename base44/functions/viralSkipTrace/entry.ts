import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";

// viralSkipTrace — the "skip trace" system that finds top creators across
// social media (via free YouTube search + oEmbed), reverse-engineers their
// video styles, and classifies them into 10 distinct viral style templates.
// Each template becomes a reusable pattern users can generate videos from.
//
// Powered by Vercel AI Gateway (no Base44 integration credits required).
// YouTube oEmbed + search HTML parsing are free public endpoints.
//
// Input: { refresh?: boolean }
// Output: { discovered, templates, styles }

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

// 10 broad search queries — each surfaces a different viral video FORMAT
// so the LLM can cluster them into 10 distinct styles.
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

    // 2. Classify into 10 distinct viral styles via LLM
    const classifyPrompt = `You are a viral content analyst. Below is a dataset of real trending videos discovered across YouTube, grouped by the search query that surfaced them. Your job is to identify the TOP 10 DISTINCT VIRAL VIDEO STYLES that top creators use — each style is a repeatable FORMAT/pattern (not a topic).

Each of the 10 styles must be genuinely different in structure: hook, pacing, shot sequence, music, and caption approach. Base them on the real creators and titles in the dataset, but generalize each into a reusable template anyone could follow.

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
- visual_prompt_template: a cinematic visual prompt template for AI video generation (vertical 9:16), with a {USER_IDEA} placeholder, describing lighting, camera movement, mood
- thumbnail_style: thumbnail/cover visual approach
- avg_duration: typical duration in seconds (6 or 8)
- difficulty: beginner | intermediate | advanced`;

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