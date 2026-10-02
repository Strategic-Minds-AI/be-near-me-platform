import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion, generateImage } from "../../shared/vercelAiGateway.ts";
import { discoverVideos, slugify } from "../../shared/youtubeDiscovery.ts";

// ingestTrendingSystem — the one-time ingestion pipeline that:
//   1. Scans YouTube for trending viral videos across multiple style categories
//   2. Uses AI to classify them into 12 distinct viral style templates with FULL
//      visual DNA (color palette, font style, visual effects, text overlay style,
//      symbols, transitions, lighting, thumbnail text pattern)
//   3. Upserts each as a ViralTemplate record
//   4. Generates a polished AI thumbnail image for each template using the
//      Vercel AI Gateway (openai/gpt-image-2) — no Base44 integration credits
//   5. Stores the thumbnail_url on each template
//
// This is the system that turns raw trending videos into ready-to-use templates
// with professional visual previews.
//
// Input: { force_thumbnails?: boolean }
// Output: { discovered, templates_created, thumbnails_generated, styles }

const STYLE_QUERIES = [
  "viral transition reel tiktok 2026",
  "storytime vlog storytelling",
  "aesthetic day in the life",
  "fast cut tutorial how to",
  "reaction video trend 2026",
  "challenge trend viral",
  "transformation before after",
  "listicle countdown top 5",
  "behind the scenes process",
  "trend remix mashup edit",
  "cinematic travel reel",
  "cooking recipe short viral",
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({})) || {};
    const forceThumbnails = body.force_thumbnails === true;

    // ── Step 1: Discover trending videos ──
    const discovered = await discoverVideos(STYLE_QUERIES, 5);

    if (discovered.length === 0) {
      return Response.json({ error: 'No videos discovered from YouTube' }, { status: 502 });
    }

    // ── Step 2: Classify into 12 distinct viral styles with FULL visual DNA ──
    const classifyPrompt = `You are a viral content analyst and visual designer. Below is a dataset of real trending videos from YouTube. Identify the TOP 12 DISTINCT VIRAL VIDEO STYLES — each a repeatable FORMAT/pattern (not a topic). Each style must be genuinely different in structure AND visual aesthetic.

DISCOVERED VIDEOS (title | creator | search query):
${JSON.stringify(discovered)}

Return EXACTLY 12 styles as JSON. Each must have ALL of these fields:
- style_name: catchy name for this viral style
- category: one of gaming|music|vlogs|education|entertainment|sports|news|tech|comedy|film|howto|travel|food|fashion|art|science|pets|autos|other
- tagline: max 80 chars
- description: 2-3 sentences explaining what this style is and why it works
- hook_pattern: the opening hook structure that grabs attention in 1-2 seconds
- pacing: edit rhythm and cut frequency
- shot_list: 4-6 shots in the typical sequence
- music_style: audio/music approach
- caption_formula: caption/text overlay structure
- example_creators: 2-4 real creator names
- example_video_titles: 2-3 example titles
- viral_prompt_template: fill-in prompt with {USER_IDEA} placeholder
- visual_prompt_template: cinematic visual prompt for AI video generation, vertical 9:16, with {USER_IDEA}
- thumbnail_style: thumbnail/cover visual approach
- avg_duration: 6 or 8
- difficulty: beginner|intermediate|advanced
- color_palette: array of 3-5 hex color codes top creators use (e.g. ["#FF006E","#0A0A0A","#FFFFFF"])
- font_style: typography description (family, weight, treatment — e.g. "Bold sans-serif uppercase, white with black outline")
- visual_effects: array of 3-5 visual effects (e.g. "speed ramp","match cut","whip pan")
- text_overlay_style: on-screen text treatment (outline, shadow, placement, animation)
- symbols_motifs: array of 2-4 recurring visual symbols/stickers/motifs
- transition_style: how cuts/transitions are executed
- aspect_ratio: "9:16"
- lighting_style: lighting approach (e.g. "golden hour natural","neon ring light","flat even lighting")
- thumbnail_text_pattern: how text is placed on thumbnails (e.g. "Large yellow text top-left, shocked face bottom-right")`;

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
                text_overlay_style: { type: 'string' },
                symbols_motifs: { type: "array", items: { type: "string" } },
                transition_style: { type: 'string' },
                aspect_ratio: { type: 'string' },
                lighting_style: { type: 'string' },
                thumbnail_text_pattern: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const styleList = styles.styles || [];

    // ── Step 3: Upsert templates ──
    const now = new Date().toISOString();
    const records = styleList.map((s) => ({
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
      color_palette: s.color_palette || [],
      font_style: s.font_style || '',
      visual_effects: s.visual_effects || [],
      text_overlay_style: s.text_overlay_style || '',
      symbols_motifs: s.symbols_motifs || [],
      transition_style: s.transition_style || '',
      aspect_ratio: s.aspect_ratio || '9:16',
      lighting_style: s.lighting_style || '',
      thumbnail_text_pattern: s.thumbnail_text_pattern || '',
      discovered_at: now,
    }));

    let upsertedRecords = [];
    if (records.length > 0) {
      const res = await base44.asServiceRole.entities.ViralTemplate.upsert(records, { key: 'slug' });
      upsertedRecords = res?.records || [];
    }

    // ── Step 4: Generate polished AI thumbnails for each template ──
    const thumbnailResults = [];

    for (const template of upsertedRecords) {
      // Skip if already has a thumbnail and not forcing
      if (template.thumbnail_url && !forceThumbnails) {
        thumbnailResults.push({ id: template.id, status: 'skipped', name: template.style_name });
        continue;
      }

      // Build a polished thumbnail prompt from the template's full visual DNA
      const palette = (template.color_palette || []).join(', ');
      const thumbPrompt = [
        `Create a polished, professional vertical 9:16 social media video thumbnail preview.`,
        `Style: ${template.style_name} — ${template.tagline || ''}`,
        template.visual_prompt_template
          ? `Scene: ${template.visual_prompt_template.replace(/\{USER_IDEA\}/g, 'a visually stunning moment')}`
          : '',
        palette ? `Color palette: ${palette}` : '',
        template.lighting_style ? `Lighting: ${template.lighting_style}` : '',
        (template.visual_effects || []).length ? `Visual effects: ${template.visual_effects.join(', ')}` : '',
        template.font_style ? `Typography style: ${template.font_style}` : '',
        template.text_overlay_style ? `Text overlay: ${template.text_overlay_style}` : '',
        template.thumbnail_text_pattern ? `Text placement: ${template.thumbnail_text_pattern}` : '',
        (template.symbols_motifs || []).length ? `Visual motifs: ${template.symbols_motifs.join(', ')}` : '',
        template.transition_style ? `Transition feel: ${template.transition_style}` : '',
        'Make it look like a real, high-quality TikTok/Reels thumbnail — cinematic, eye-catching, vibrant, professional color grading.',
        'No readable text, no watermarks, no logos — pure visual preview that represents this viral style.',
      ].filter(Boolean).join('\n');

      try {
        const imgRes = await generateImage(thumbPrompt, { model: 'openai/gpt-image-2' });
        if (imgRes?.url) {
          await base44.asServiceRole.entities.ViralTemplate.update(template.id, {
            thumbnail_url: imgRes.url,
          });
          thumbnailResults.push({ id: template.id, status: 'generated', name: template.style_name });
        } else {
          thumbnailResults.push({ id: template.id, status: 'failed', name: template.style_name, error: 'No URL' });
        }
      } catch (imgErr) {
        thumbnailResults.push({ id: template.id, status: 'failed', name: template.style_name, error: imgErr.message });
      }
    }

    const generated = thumbnailResults.filter((r) => r.status === 'generated').length;
    const skipped = thumbnailResults.filter((r) => r.status === 'skipped').length;
    const failed = thumbnailResults.filter((r) => r.status === 'failed').length;

    return Response.json({
      status: 'complete',
      discovered: discovered.length,
      templates_created: upsertedRecords.length,
      thumbnails_generated: generated,
      thumbnails_skipped: skipped,
      thumbnails_failed: failed,
      styles: styleList.map((s) => s.style_name),
      thumbnail_results: thumbnailResults,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}