import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { chatCompletion, generateVideo } from "../../shared/vercelAiGateway.ts";

// pictureToVideo — the multi-picture-to-viral-video engine.
// Now powered by Vercel AI Gateway (no Base44 integration credits required).
// 1. Takes an array of picture URLs/base64 data URLs + optional user idea + category.
// 2. Fetches the platform's top-performing videos as viral references.
// 3. Uses Vercel AI Gateway (Claude Opus 5 with vision) to analyze every picture
//    + the viral formula from top videos + the user's idea → generates an optimized
//    viral video prompt that COMBINES all pictures into one cohesive video.
// 4. If suggest_prompt is true, returns only the analysis (no video generation).
// 5. If regenerate is true, instructs the LLM to create a DIFFERENT concept.
// 6. Otherwise, generates a 6-second vertical (9:16) video via Vercel AI Gateway (Veo 3.1).

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const { picture_urls, user_idea, category, suggest_prompt, regenerate } = body;

    const urls = Array.isArray(picture_urls) ? picture_urls.filter(Boolean) : [];
    if (urls.length === 0) return Response.json({ error: "At least one picture required" }, { status: 400 });

    // 1. Fetch top-performing videos as viral references
    const query = category ? { visibility: "public", category } : { visibility: "public" };
    const topVideos = await base44.entities.Video.filter(query, "-views", 10);
    const videoData = (topVideos || []).map((v) => ({
      title: v.title,
      category: v.category,
      tags: v.tags,
      views: v.views,
    }));

    // 2. Analyze all pictures + top videos + user idea → generate viral video prompt
    const regenInstruction = regenerate
      ? "\n\nIMPORTANT: This is a REGENERATION request. The user wants a completely DIFFERENT video concept from any previous attempt. Use a different angle, different scene, different visual style — but still incorporate the picture(s) and mirror the viral patterns."
      : "";

    const picWord = urls.length === 1 ? "a picture" : urls.length + " pictures";
    const combineWord = urls.length === 1 ? "it" : "all of them into one cohesive video";

    const prompt = `You are a viral video director for Be Near Me, a positivity-only short-form video platform. The user uploaded ${picWord} and wants to create a viral video that combines ${combineWord}.

USER'S IDEA: ${user_idea || "(no specific idea — suggest the best one)"}
CATEGORY: ${category || "all"}

TOP PERFORMING VIDEOS ON THE PLATFORM (viral references):
${JSON.stringify(videoData.slice(0, 8), null, 2)}

Analyze the uploaded picture(s) and the viral references above. Then create a viral video concept that COMBINES elements from ${urls.length === 1 ? "the picture" : "all the pictures"} into one cohesive short-form video and mirrors the winning patterns from the top videos.${regenInstruction}

Return JSON with:
- picture_analysis: brief description of what's in the picture(s) (1-2 sentences)
- suggested_idea: the viral idea we recommend (refine the user's idea if they gave one; suggest one if they didn't)
- viral_prompt: the exact text someone should type into an AI video generator to get a viral video — this is shown to the user so they know what to type
- video_title: an optimized viral title (max 80 chars)
- visual_prompt: a detailed cinematic prompt for AI video generation — vertical 9:16, specific scene describing how the picture(s) elements combine, lighting, camera movement, mood, ultra detailed. This is what the video generator receives, so be vivid and specific.`;

    const analysis = await chatCompletion(prompt, {
      images: urls,
      model: "gemini_3_flash",
      jsonSchema: {
        type: "object",
        properties: {
          picture_analysis: { type: "string" },
          suggested_idea: { type: "string" },
          viral_prompt: { type: "string" },
          video_title: { type: "string" },
          visual_prompt: { type: "string" },
        },
      },
    });

    // If suggest_prompt only, return the analysis without generating the video
    if (suggest_prompt) {
      return Response.json({ analysis, video_url: null });
    }

    // 3. Generate the video from the visual prompt via Vercel AI Gateway
    const visualPrompt =
      analysis.visual_prompt ||
      analysis.viral_prompt ||
      "A cinematic vertical 9:16 video, engaging and visually stunning, ultra detailed";

    let genResult = null;
    let generationError = null;
    try {
      genResult = await generateVideo(visualPrompt, { duration: 6, aspectRatio: "9:16" });
    } catch (e) {
      generationError = e.message;
    }

    if (!genResult?.url) {
      return Response.json({
        analysis,
        video_url: null,
        error: generationError || "Video generation returned no URL",
      });
    }

    // 4. Resolve creator's channel for attribution
    let channel = null;
    try {
      const chRes = await base44.entities.Channel.filter({ created_by: user.email });
      channel = Array.isArray(chRes) ? chRes[0] : chRes?.items?.[0];
    } catch {
      // ignore
    }

    // 5. Save to the feed
    const video = await base44.entities.Video.create({
      title: analysis.video_title || "AI Generated Video",
      url: genResult.url,
      thumbnail_url: genResult.url,
      category: category || "entertainment",
      tags: ["ai_generated", "picture_to_video", "viral"],
      duration: 6,
      channel_id: channel?.id || "",
      channel_name: channel?.name || "AI Studio",
      channel_avatar: channel?.avatar_url || "",
      visibility: "public",
      processing_status: "done",
      published_at: new Date().toISOString(),
    });

    return Response.json({
      analysis,
      video_url: genResult.url,
      video_id: video.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}