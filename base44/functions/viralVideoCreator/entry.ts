import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Viral Video Creator — the parity system.
// 1. Fetches the top-performing videos on the platform (by views).
// 2. Uses InvokeLLM to analyze the "viral formula" — themes, title patterns,
//    tags, categories — and generate a NEW video concept that mirrors them.
// 3. Uses GenerateVideo to produce a 6-second vertical (9:16) video from the
//    concept's visual prompt.
// 4. Saves the generated video to the Video entity so it lands in the feed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const { category, count = 10 } = body;

    // 1. Fetch top-performing videos
    const query = category
      ? { visibility: 'public', category }
      : { visibility: 'public' };
    const topVideos = await base44.entities.Video.filter(query, '-views', count);

    if (!topVideos || topVideos.length === 0) {
      return Response.json({ error: 'No videos found to analyze' }, { status: 404 });
    }

    // 2. Analyze viral patterns + generate a parity concept
    const videoData = topVideos.map((v) => ({
      title: v.title,
      description: v.description,
      category: v.category,
      tags: v.tags,
      views: v.views,
      likes: v.likes,
      channel_name: v.channel_name,
      duration: v.duration,
    }));

    const analysisPrompt = `You are a viral video analyst and content strategist. Below are the top-performing videos from our platform, sorted by views. Your job is to reverse-engineer WHY they went viral and then create a NEW video concept that MIRRORS the winning patterns — a "parity video" designed to replicate that success.

TOP VIDEOS (sorted by views, highest first):
${JSON.stringify(videoData, null, 2)}

STEP 1 — ANALYZE THE VIRAL FORMULA:
- viral_formula: The core pattern/strategy that makes these videos successful (2-3 sentences, be specific)
- common_themes: Recurring themes/topics across the top videos (5-8 items)
- title_patterns: Title structures/formats that appear repeatedly (e.g. "How to ___ in ___ seconds", "The ___ you've never seen") (5-8 items)
- winning_tags: Tags that appear most frequently across the top videos (8-12 items)
- top_categories: Which categories dominate the top videos (3-5 items)

STEP 2 — CREATE A PARITY VIDEO CONCEPT:
Using the analysis above, design a NEW video that mimics the winning patterns. It must feel native to the platform — same tone, same structure, same audience appeal — but be original content.
- title: A title that follows the winning title patterns (max 80 chars)
- description: An optimized 1-2 sentence description
- script: A 6-second video script describing exactly what happens on screen
- tags: 5-8 tags that mirror the winning tags
- category: The best-performing category from the analysis
- visual_prompt: A detailed, cinematic visual prompt for AI video generation. Must include: vertical 9:16 aspect ratio, specific scene description, lighting, camera movement, mood, and ultra detailed. This prompt is what the video generator receives, so be vivid and specific.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          viral_formula: { type: 'string' },
          common_themes: { type: 'array', items: { type: 'string' } },
          title_patterns: { type: 'array', items: { type: 'string' } },
          winning_tags: { type: 'array', items: { type: 'string' } },
          top_categories: { type: 'array', items: { type: 'string' } },
          video_concept: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              script: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              visual_prompt: { type: 'string' },
            },
          },
        },
      },
    });

    // 3. Generate the video from the concept's visual prompt
    const concept = analysis.video_concept || {};
    const visualPrompt =
      concept.visual_prompt ||
      'A cinematic vertical 9:16 video, engaging and visually stunning, ultra detailed';

    let genResult: any = null;
    let generationError: string | null = null;
    try {
      genResult = await base44.asServiceRole.integrations.Core.GenerateVideo({
        prompt: visualPrompt,
        duration: 6,
        aspect_ratio: '9:16',
      });
    } catch (e) {
      generationError = e.message;
    }

    if (!genResult?.url) {
      // Return the analysis even if video generation fails (e.g. credits exhausted)
      return Response.json({
        analysis: {
          viral_formula: analysis.viral_formula,
          common_themes: analysis.common_themes,
          title_patterns: analysis.title_patterns,
          winning_tags: analysis.winning_tags,
          top_categories: analysis.top_categories,
        },
        concept,
        video_url: null,
        error: generationError || 'Video generation returned no URL — credits may be exhausted',
      });
    }

    // Quality gate: validate the generated video URL is accessible before publishing
    try {
      const qualityCheck = await fetch(genResult.url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      if (!qualityCheck.ok) {
        return Response.json({
          analysis: {
            viral_formula: analysis.viral_formula,
            common_themes: analysis.common_themes,
            title_patterns: analysis.title_patterns,
            winning_tags: analysis.winning_tags,
            top_categories: analysis.top_categories,
          },
          concept,
          video_url: null,
          error: 'Generated video failed quality check — not published',
        });
      }
    } catch {
      return Response.json({
        analysis: {
          viral_formula: analysis.viral_formula,
          common_themes: analysis.common_themes,
          title_patterns: analysis.title_patterns,
          winning_tags: analysis.winning_tags,
          top_categories: analysis.top_categories,
        },
        concept,
        video_url: null,
        error: 'Generated video URL not accessible — not published',
      });
    }

    // 4. Resolve creator's channel for attribution
    let channel: any = null;
    try {
      const chRes = await base44.entities.Channel.filter({ created_by: user.email });
      channel = Array.isArray(chRes) ? chRes[0] : chRes?.items?.[0];
    } catch {
      // ignore
    }

    // 5. Save to database so it lands in the feed
    const video = await base44.entities.Video.create({
      title: concept.title || 'AI Viral Video',
      description: concept.description || 'Generated by Viral Video Creator',
      url: genResult.url,
      thumbnail_url: genResult.url,
      category: concept.category || 'entertainment',
      tags: [...(concept.tags || []), 'ai_generated', 'viral_creator'],
      duration: 6,
      channel_id: channel?.id || '',
      channel_name: channel?.name || 'Viral Video Creator',
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
      analysis: {
        viral_formula: analysis.viral_formula,
        common_themes: analysis.common_themes,
        title_patterns: analysis.title_patterns,
        winning_tags: analysis.winning_tags,
        top_categories: analysis.top_categories,
      },
      concept,
      video: {
        id: video.id,
        title: video.title,
        url: genResult.url,
        category: video.category,
        tags: video.tags,
      },
      video_url: genResult.url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});