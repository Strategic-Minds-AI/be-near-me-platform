import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// pictureToVideo — the picture-to-viral-video engine.
// 1. Takes an uploaded picture URL + optional user idea + optional category.
// 2. Fetches the platform's top-performing videos as viral references.
// 3. Uses InvokeLLM with vision (file_urls) to analyze the picture + the viral
//    formula from top videos + the user's idea → generates an optimized viral
//    video prompt (shown to the user so they know "what to type").
// 4. If suggest_prompt is true, returns only the analysis (no video generation).
// 5. Otherwise, generates a 6-second vertical (9:16) video from the visual prompt
//    and saves it to the Video entity so it lands in the feed.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const { picture_url, user_idea, category, suggest_prompt } = body;

    if (!picture_url) return Response.json({ error: "Picture URL required" }, { status: 400 });

    // 1. Fetch top-performing videos as viral references
    const query = category ? { visibility: "public", category } : { visibility: "public" };
    const topVideos = await base44.entities.Video.filter(query, "-views", 10);
    const videoData = (topVideos || []).map((v) => ({
      title: v.title,
      category: v.category,
      tags: v.tags,
      views: v.views,
    }));

    // 2. Analyze picture + top videos + user idea → generate viral video prompt
    const prompt = `You are a viral video director for Be Near Me, a positivity-only short-form video platform. The user uploaded a picture and wants to create a viral video inspired by it.

USER'S IDEA: ${user_idea || "(no specific idea — suggest the best one)"}
CATEGORY: ${category || "all"}

TOP PERFORMING VIDEOS ON THE PLATFORM (viral references):
${JSON.stringify(videoData.slice(0, 8), null, 2)}

Analyze the uploaded picture (provided as a file attachment) and the viral references above. Then create a viral video concept that incorporates the picture's subject/feeling and mirrors the winning patterns from the top videos.

Return JSON with:
- picture_analysis: brief description of what's in the picture (1-2 sentences)
- suggested_idea: the viral idea we recommend (refine the user's idea if they gave one; suggest one if they didn't)
- viral_prompt: the exact text someone should type into an AI video generator to get a viral video — this is shown to the user so they know what to type
- video_title: an optimized viral title (max 80 chars)
- visual_prompt: a detailed cinematic prompt for AI video generation — vertical 9:16, specific scene, lighting, camera movement, mood, ultra detailed. This is what the video generator receives, so be vivid and specific.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [picture_url],
      response_json_schema: {
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

    // 3. Generate the video from the visual prompt
    const visualPrompt =
      analysis.visual_prompt ||
      analysis.viral_prompt ||
      "A cinematic vertical 9:16 video, engaging and visually stunning, ultra detailed";

    let genResult = null;
    let generationError = null;
    try {
      genResult = await base44.asServiceRole.integrations.Core.GenerateVideo({
        prompt: visualPrompt,
        duration: 6,
        aspect_ratio: "9:16",
      });
    } catch (e) {
      generationError = e.message;
    }

    if (!genResult?.url) {
      return Response.json({
        analysis,
        video_url: null,
        error: generationError || "Video generation returned no URL — credits may be exhausted",
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