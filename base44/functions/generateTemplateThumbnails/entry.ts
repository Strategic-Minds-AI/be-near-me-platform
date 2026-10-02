import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * generateTemplateThumbnails — Admin-only function that generates real AI
 * thumbnail images for viral templates using each template's visual_prompt_template.
 *
 * For each template without a thumbnail_url (or when force=true):
 *   1. Builds a thumbnail prompt from the template's visual_prompt_template + style DNA
 *   2. Calls GenerateImage to produce a 9:16 vertical preview
 *   3. Updates the template's thumbnail_url field
 *
 * When integration credits are exhausted, returns a clear status so the
 * frontend can fall back to CSS-based TemplateStylePreview.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const force = body.force === true;
    const templateId = body.template_id; // optional: generate for one template

    // Load templates
    let templates;
    if (templateId) {
      const t = await base44.asServiceRole.entities.ViralTemplate.get(templateId);
      templates = [t];
    } else {
      const res = await base44.asServiceRole.entities.ViralTemplate.filter(
        {},
        { sort: "style_name", limit: 100 }
      );
      templates = res.items || [];
    }

    const results = [];
    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const template of templates) {
      // Skip if already has thumbnail and not forcing
      if (template.thumbnail_url && !force) {
        skipped++;
        results.push({ id: template.id, status: "skipped", name: template.style_name });
        continue;
      }

      // Build the thumbnail prompt from the template's visual DNA
      const visualPrompt = template.visual_prompt_template || "";
      const palette = (template.color_palette || []).join(", ");
      const fontDesc = template.font_style || "bold sans-serif";
      const lighting = template.lighting_style || "natural lighting";
      const effects = (template.visual_effects || []).join(", ");

      const thumbPrompt = [
        `Vertical 9:16 social media video thumbnail preview.`,
        visualPrompt ? `Scene: ${visualPrompt}` : "",
        palette ? `Color palette: ${palette}` : "",
        `Lighting: ${lighting}`,
        effects ? `Visual effects: ${effects}` : "",
        `Text style: ${fontDesc}`,
        "Cinematic, high quality, eye-catching, designed for TikTok/Reels feed.",
        "No text, no watermark, pure visual preview."
      ].filter(Boolean).join(" ");

      try {
        const imgRes = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: thumbPrompt,
        });
        const imageUrl = imgRes?.url;

        if (imageUrl) {
          await base44.asServiceRole.entities.ViralTemplate.update(template.id, {
            thumbnail_url: imageUrl,
          });
          generated++;
          results.push({ id: template.id, status: "generated", name: template.style_name, url: imageUrl });
        } else {
          failed++;
          results.push({ id: template.id, status: "failed", name: template.style_name, error: "No image URL returned" });
        }
      } catch (genErr) {
        failed++;
        const errMsg = genErr.message || String(genErr);
        const isCreditError = /credit|limit|quota|exhaust|not.?configured/i.test(errMsg);

        results.push({
          id: template.id,
          status: "failed",
          name: template.style_name,
          error: errMsg,
          credit_exhausted: isCreditError,
        });

        // If credits are exhausted, stop trying — all will fail
        if (isCreditError) {
          return Response.json({
            status: "credits_exhausted",
            message: "Integration credits are exhausted. Thumbnail generation will work after credits reset.",
            generated,
            skipped,
            failed,
            results: results.slice(0, 5),
            credit_reset_date: "2026-10-12",
          });
        }
      }
    }

    return Response.json({
      status: "complete",
      generated,
      skipped,
      failed,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}