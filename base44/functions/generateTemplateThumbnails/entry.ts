import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateImage } from "../../shared/vercelAiGateway.ts";

// Upload image bytes to a free public host (catbox.moe — no API key needed).
// Returns a permanent public URL.
async function uploadToPublicHost(imageBytes, filename) {
  const blob = new Blob([imageBytes], { type: 'image/png' });
  const fileObj = new File([blob], filename, { type: 'image/png' });
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('fileToUpload', fileObj);
  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
  });
  const text = await res.text();
  if (text.startsWith('https://')) return text.trim();
  throw new Error('Image host returned: ' + text.slice(0, 200));
}

// generateTemplateThumbnails — regenerates polished AI thumbnail images for
// existing ViralTemplate records using the Vercel AI Gateway (openai/gpt-image-2),
// then uploads each image to public storage and stores the public URL.
// No Base44 integration credits needed for generation (uses Vercel gateway);
// UploadPublicFile uses Base44 credits for storage hosting.
//
// Input: { force?: boolean, template_id?: string, limit?: number }
// Output: { generated, skipped, failed, results }

function buildThumbPrompt(template) {
  const palette = (template.color_palette || []).join(", ");
  return [
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
    'Make it look like a real, high-quality TikTok/Reels thumbnail — cinematic, eye-catching, vibrant, professional color grading.',
    'No readable text, no watermarks, no logos — pure visual preview that represents this viral style.',
  ].filter(Boolean).join('\n');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({})) || {};
    const force = body.force === true;
    const templateId = body.template_id;
    const limit = body.limit || 8;

    let templates;
    if (templateId) {
      const t = await base44.asServiceRole.entities.ViralTemplate.get(templateId);
      templates = [t];
    } else {
      const query = force ? {} : { thumbnail_url: { $exists: false } };
      const res = await base44.asServiceRole.entities.ViralTemplate.filter(
        query,
        { sort: "style_name", limit }
      );
      templates = res.items || [];
    }

    const results = [];
    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const template of templates) {
      if (template.thumbnail_url && !force) {
        skipped++;
        results.push({ id: template.id, status: "skipped", name: template.style_name });
        continue;
      }

      const thumbPrompt = buildThumbPrompt(template);

      try {
        // Generate image via Vercel AI Gateway (returns base64 data URL)
        const imgRes = await generateImage(thumbPrompt, { model: 'openai/gpt-image-2' });
        const dataUrl = imgRes?.url;

        if (!dataUrl) {
          failed++;
          results.push({ id: template.id, status: "failed", name: template.style_name, error: "No image returned" });
          continue;
        }

        // If it's already a hosted URL (not base64), store directly
        if (dataUrl.startsWith('http') && !dataUrl.startsWith('data:')) {
          await base44.asServiceRole.entities.ViralTemplate.update(template.id, {
            thumbnail_url: dataUrl,
          });
          generated++;
          results.push({ id: template.id, status: "generated", name: template.style_name, url: dataUrl.slice(0, 80) });
          continue;
        }

        // It's a base64 data URL — upload to free public host
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const publicUrl = await uploadToPublicHost(imageBytes, `template-${template.slug || template.id}.png`);

        if (publicUrl) {
          await base44.asServiceRole.entities.ViralTemplate.update(template.id, {
            thumbnail_url: publicUrl,
          });
          generated++;
          results.push({ id: template.id, status: "generated", name: template.style_name, url: publicUrl.slice(0, 80) });
        } else {
          failed++;
          results.push({ id: template.id, status: "failed", name: template.style_name, error: "Upload returned no URL" });
        }
      } catch (genErr) {
        failed++;
        results.push({ id: template.id, status: "failed", name: template.style_name, error: genErr.message });
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