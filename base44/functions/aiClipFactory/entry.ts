import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion } from "../../shared/vercelAiGateway.ts";

// AI Clip Factory — analyzes a video and generates:
// - 10 short clip concepts (timestamps + titles)
// - 10 title variants
// - 5 thumbnail concepts
// - Auto chapters
// - SEO description
// Now powered by Vercel AI Gateway — no Base44 integration credits required.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { videoId } = body;
    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

    const videos = await base44.entities.Video.filter({ id: videoId });
    const video = videos?.[0];
    if (!video) return Response.json({ error: 'Video not found' }, { status: 404 });

    // Verify ownership
    if (video.created_by !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prompt = `You are an expert YouTube content strategist and editor. Analyze this video and generate content assets.

Video Title: "${video.title}"
Description: "${video.description || 'No description'}"
Category: "${video.category || 'general'}"
Duration: ${video.duration || 0} seconds (${Math.floor((video.duration || 0) / 60)} minutes)
Tags: ${video.tags?.join(', ') || 'none'}
Views: ${video.views || 0}
Likes: ${video.likes || 0}

Generate the following:

1. SHORT CLIPS: 8 compelling clip ideas from this video. Each clip should be 30-60 seconds, cover a key moment, and work well as a Short. Give specific timestamp ranges and hook-first titles.

2. TITLE VARIANTS: 10 alternative video titles optimized for YouTube SEO and CTR. Mix emotional, curiosity, how-to, and list formats.

3. THUMBNAIL CONCEPTS: 5 thumbnail design concepts. Describe the image, text overlay, color scheme, and emotional hook.

4. VIDEO CHAPTERS: Auto-generated chapter timestamps for the full video. Estimate logical sections.

5. SEO DESCRIPTION: A fully optimized 200-word video description with keywords, timestamps, and CTA.

Be specific, creative, and data-driven.`;

    const result = await chatCompletion(prompt, {
      model: "gemini_3_flash",
      jsonSchema: {
        type: "object",
        properties: {
          clips: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                start_seconds: { type: "number" },
                end_seconds: { type: "number" },
                hook: { type: "string" },
                category_fit: { type: "string" }
              }
            }
          },
          title_variants: { type: "array", items: { type: "string" } },
          thumbnail_concepts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                concept: { type: "string" },
                text_overlay: { type: "string" },
                color_scheme: { type: "string" },
                emotion: { type: "string" }
              }
            }
          },
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string" },
                title: { type: "string" }
              }
            }
          },
          seo_description: { type: "string" }
        }
      }
    });

    return Response.json({
      video_id: videoId,
      video_title: video.title,
      assets: result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}