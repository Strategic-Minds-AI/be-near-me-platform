import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion, generateVideo } from "../../shared/vercelAiGateway.ts";

// generateFromTemplate — generates a viral video using a selected style template.
// The user picks one of the 10 skip-traced ViralTemplates, optionally adds their
// own idea, and this function builds a concept that follows that exact style,
// then generates a vertical video via Vercel AI Gateway (Veo 3.1) and publishes
// it to the feed.
//
// Powered by Vercel AI Gateway (no Base44 integration credits required).
//
// Input: { template_id, user_idea? }
// Output: { analysis, video_url, video_id }

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const { template_id, user_idea } = body;
    if (!template_id) return Response.json({ error: 'template_id required' }, { status: 400 });

    // 1. Load the selected template
    const template = await base44.entities.ViralTemplate.get(template_id);
    if (!template) return Response.json({ error: 'Template not found' }, { status: 404 });

    const idea = user_idea?.trim() || '(use the style\'s natural subject — pick something universally appealing and positive)';

    // 2. Build a concept that follows this exact style
    const conceptPrompt = `You are a viral video director for Be Near Me, a positivity-only short-form video platform. The user selected this viral STYLE TEMPLATE and wants a video made in exactly this style.

STYLE TEMPLATE:
- Style: ${template.style_name}
- Category: ${template.category}
- Hook pattern: ${template.hook_pattern}
- Pacing: ${template.pacing}
- Shot list: ${(template.shot_list || []).join(' → ')}
- Music: ${template.music_style}
- Caption formula: ${template.caption_formula}
- Thumbnail style: ${template.thumbnail_style}

USER'S IDEA: ${idea}

Create a video concept that STRICTLY follows the style template above — same hook structure, same pacing, same shot rhythm, same music vibe — applied to the user's idea. Keep it positive, uplifting, and universally appealing (no negativity, bullying, or shame).

Return JSON with:
- title: an optimized viral title following the style (max 80 chars)
- description: a 1-2 sentence caption
- script: a beat-by-beat script describing what happens on screen (6 seconds)
- tags: 5-7 tags
- visual_prompt: a detailed cinematic prompt for AI video generation — vertical 9:16, ${template.avg_duration || 6}s. Incorporate the style's pacing, camera movement, lighting, and mood. Be vivid and specific. This is what the video generator receives.`;

    const analysis = await chatCompletion(conceptPrompt, {
      model: 'gemini_3_flash',
      jsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          script: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          visual_prompt: { type: 'string' },
        },
      },
    });

    // 3. Generate the video via Vercel AI Gateway (Veo 3.1)
    const visualPrompt =
      analysis.visual_prompt ||
      template.visual_prompt_template?.replace('{USER_IDEA}', idea) ||
      'A cinematic vertical 9:16 short-form video, engaging and visually stunning, ultra detailed';

    let genResult = null;
    let generationError = null;
    try {
      genResult = await generateVideo(visualPrompt, {
        duration: template.avg_duration || 6,
        aspectRatio: '9:16',
      });
    } catch (e) {
      generationError = e.message;
    }

    if (!genResult?.url) {
      return Response.json({
        analysis,
        video_url: null,
        error: generationError || 'Video generation returned no URL',
      });
    }

    // 4. Resolve creator's channel for attribution
    let channel = null;
    try {
      const chRes = await base44.entities.Channel.filter({ created_by: user.email }, { limit: 1 });
      channel = (chRes?.items || chRes || [])[0];
    } catch {
      // ignore
    }

    // 5. Publish to the feed
    const video = await base44.entities.Video.create({
      title: analysis.title || 'AI Viral Video',
      description: analysis.description || `Made with the ${template.style_name} style`,
      url: genResult.url,
      thumbnail_url: genResult.url,
      category: template.category || 'entertainment',
      tags: [...(analysis.tags || []), 'ai_generated', 'template', template.slug],
      duration: template.avg_duration || 6,
      channel_id: channel?.id || '',
      channel_name: channel?.name || 'Be Near Me Studio',
      channel_avatar: channel?.avatar_url || '',
      visibility: 'public',
      processing_status: 'done',
      views: 0,
      likes: 0,
      dislikes: 0,
      comments_count: 0,
      published_at: new Date().toISOString(),
    });

    return Response.json({
      analysis,
      video_url: genResult.url,
      video_id: video.id,
      template: template.style_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}