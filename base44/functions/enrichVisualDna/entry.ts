import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";

// enrichVisualDna — loads existing ViralTemplates and enriches them with
// visual DNA (color palette, fonts, effects, symbols, transitions, lighting,
// text overlay style). This is a separate function from viralSkipTrace to
// keep each call within timeout limits.
//
// Powered by Vercel AI Gateway (no Base44 integration credits required).
//
// Input: {}
// Output: { enriched, count }

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Load all templates
    const res = await base44.entities.ViralTemplate.filter({}, { sort: 'style_name', limit: 50 });
    const templates = res?.items || [];
    if (templates.length === 0) {
      return Response.json({ error: 'No templates found. Run viralSkipTrace first.' }, { status: 400 });
    }

    // 2. Ask LLM to generate visual DNA for all styles in one call
    const styleSummaries = templates.map((t: any) => ({
      slug: t.slug,
      style_name: t.style_name,
      category: t.category,
      description: t.description,
      hook_pattern: t.hook_pattern,
      pacing: t.pacing,
      music_style: t.music_style,
      caption_formula: t.caption_formula,
      thumbnail_style: t.thumbnail_style,
    }));

    const prompt = `You are an expert visual designer for viral short-form video. For each viral video style below, identify the COMPLETE VISUAL DNA that top creators use. Be specific and actionable — these details feed an AI video generator.

STYLES:
${JSON.stringify(styleSummaries, null, 2)}

For each style, return:
- slug: the exact slug from the input (for matching)
- color_palette: 4-6 hex color codes (e.g. "#FF006E") that define this style's look
- font_style: typography description (family, weight, case, treatment like outlines/shadows)
- visual_effects: 3-5 specific editing techniques (e.g. "speed ramp", "match cut", "whip pan")
- text_overlay_style: on-screen text treatment (outline, shadow, placement, animation)
- symbols_motifs: 2-4 recurring visual symbols, stickers, or graphic elements
- transition_style: how cuts/transitions are executed
- lighting_style: the lighting approach
- thumbnail_text_pattern: how text and faces are arranged on the thumbnail

Return a JSON object with a "styles" array, one entry per input style.`;

    const result = await chatCompletion(prompt, {
      model: 'gemini_3_flash',
      jsonSchema: {
        type: 'object',
        properties: {
          styles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                color_palette: { type: 'array', items: { type: 'string' } },
                font_style: { type: 'string' },
                visual_effects: { type: 'array', items: { type: 'string' } },
                text_overlay_style: { type: 'string' },
                symbols_motifs: { type: 'array', items: { type: 'string' } },
                transition_style: { type: 'string' },
                lighting_style: { type: 'string' },
                thumbnail_text_pattern: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const dnaStyles = result.styles || [];

    // 3. Build a lookup and bulk-update templates with visual DNA
    const dnaBySlug: Record<string, any> = {};
    dnaStyles.forEach((d: any) => { dnaBySlug[d.slug] = d; });

    const updates = templates
      .filter((t: any) => dnaBySlug[t.slug])
      .map((t: any) => {
        const d = dnaBySlug[t.slug];
        return {
          id: t.id,
          color_palette: d.color_palette || [],
          font_style: d.font_style || '',
          visual_effects: d.visual_effects || [],
          text_overlay_style: d.text_overlay_style || '',
          symbols_motifs: d.symbols_motifs || [],
          transition_style: d.transition_style || '',
          lighting_style: d.lighting_style || '',
          thumbnail_text_pattern: d.thumbnail_text_pattern || '',
          aspect_ratio: '9:16',
        };
      });

    let enriched = 0;
    if (updates.length > 0) {
      const updateRes = await base44.entities.ViralTemplate.bulkUpdate(updates);
      enriched = (updateRes?.records || []).length || updates.length;
    }

    return Response.json({ enriched, count: templates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}