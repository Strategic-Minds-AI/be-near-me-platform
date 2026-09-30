import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// 3-Layer Recommendation Engine
// Layer 1: Popularity (trending signals)
// Layer 2: Personalization (user history + subscriptions)
// Layer 3: Exploration (new-but-related + wildcards)

function popularityScore(video) {
  const now = Date.now();
  const publishedAt = video.published_at ? new Date(video.published_at).getTime() : now;
  const ageHours = Math.max(1, (now - publishedAt) / (1000 * 60 * 60));
  const ageDays = ageHours / 24;

  // Views in last 24h approximation: total views weighted by recency
  const recencyBoost = ageHours <= 24 ? 3.0 : ageHours <= 168 ? 1.5 : 1.0;
  const views = (video.views || 0) * recencyBoost;

  // Like ratio
  const totalReactions = (video.likes || 0) + (video.dislikes || 0);
  const likeRatio = totalReactions > 0 ? (video.likes || 0) / totalReactions : 0.5;

  // Comment velocity (comments relative to age)
  const commentVelocity = (video.comments_count || 0) / ageDays;

  // Watch time signal (duration as proxy for depth)
  const durationScore = Math.min((video.duration || 60) / 600, 1); // cap at 10min

  return (
    views * 0.4 +
    likeRatio * 10000 * 0.25 +
    commentVelocity * 100 * 0.2 +
    durationScore * 5000 * 0.15
  );
}

function personalizationScore(video, watchedVideoIds, subscribedChannelIds, watchedCategories) {
  let score = 0;

  // Already watched — deprioritize heavily
  if (watchedVideoIds.has(video.id)) return -99999;

  // Subscribed channel boost
  if (video.channel_id && subscribedChannelIds.has(video.channel_id)) score += 8000;

  // Category affinity
  const catCount = watchedCategories[video.category] || 0;
  score += catCount * 500;

  // Tag overlap (using category as proxy since we don't have user tag history)
  const categoryBonus = catCount > 0 ? Math.log(catCount + 1) * 1000 : 0;
  score += categoryBonus;

  return score;
}

function explorationScore(video, watchedCategories, allCategories) {
  // Reward videos from categories the user hasn't watched much
  const catCount = watchedCategories[video.category] || 0;
  const explorationBoost = catCount === 0 ? 3000 : catCount < 3 ? 1500 : 0;

  // Occasional wildcard: boost random videos slightly for discovery
  const wildcard = Math.random() < 0.1 ? 2000 : 0;

  return explorationBoost + wildcard;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 30, 50);
    const category = body.category || null;

    // Fetch candidate videos (public only)
    const candidateQuery = { visibility: "public" };
    if (category && category !== "All") candidateQuery.category = category.toLowerCase();

    const [candidates, watchHistory, subscriptions] = await Promise.all([
      base44.entities.Video.filter(candidateQuery, "-created_date", 200),
      base44.entities.WatchHistory.filter({ created_by: user.email }, "-created_date", 100),
      base44.entities.Subscription.filter({ created_by: user.email }),
    ]);

    // Build user context
    const watchedVideoIds = new Set(watchHistory.map(h => h.video_id));
    const subscribedChannelIds = new Set(subscriptions.map(s => s.channel_id));

    // Build category affinity map
    const watchedCategories = {};
    for (const h of watchHistory) {
      // We'll approximate category from watched video data
      // (In production, WatchHistory would store category)
    }
    // Add category affinity from subscriptions (use subscribed channel context)
    for (const video of candidates) {
      if (subscribedChannelIds.has(video.channel_id) && video.category) {
        watchedCategories[video.category] = (watchedCategories[video.category] || 0) + 1;
      }
    }

    const allCategories = [...new Set(candidates.map(v => v.category).filter(Boolean))];

    // Score every candidate
    const scored = candidates.map(video => {
      const pop = popularityScore(video);
      const pers = personalizationScore(video, watchedVideoIds, subscribedChannelIds, watchedCategories);
      const exp = explorationScore(video, watchedCategories, allCategories);

      // Blend: 40% popularity, 40% personalization, 20% exploration
      const total = pop * 0.4 + pers * 0.4 + exp * 0.2;

      return { video, score: total };
    });

    // Sort by score descending, filter out already-watched
    const filtered = scored
      .filter(s => s.score > -99999)
      .sort((a, b) => b.score - a.score);

    // Apply 80/20 mix: 80% high-score, 20% exploration picks
    const topCount = Math.floor(limit * 0.8);
    const exploreCount = limit - topCount;

    const topVideos = filtered.slice(0, topCount).map(s => s.video);

    // Exploration: pick from lower-ranked but category-diverse videos
    const explorationPool = filtered.slice(topCount, topCount + 50);
    const exploreVideos = [];
    const usedCategories = new Set(topVideos.map(v => v.category));
    for (const s of explorationPool) {
      if (exploreVideos.length >= exploreCount) break;
      if (!usedCategories.has(s.video.category)) {
        exploreVideos.push(s.video);
        usedCategories.add(s.video.category);
      }
    }
    // Fill remaining exploration slots from pool
    for (const s of explorationPool) {
      if (exploreVideos.length >= exploreCount) break;
      if (!topVideos.includes(s.video) && !exploreVideos.includes(s.video)) {
        exploreVideos.push(s.video);
      }
    }

    // Interleave: for every 4 top videos, insert 1 exploration video
    const result = [];
    let exploreIdx = 0;
    for (let i = 0; i < topVideos.length; i++) {
      result.push(topVideos[i]);
      if ((i + 1) % 4 === 0 && exploreIdx < exploreVideos.length) {
        result.push(exploreVideos[exploreIdx++]);
      }
    }
    while (exploreIdx < exploreVideos.length) {
      result.push(exploreVideos[exploreIdx++]);
    }

    return Response.json({ 
      videos: result.slice(0, limit),
      meta: {
        total_candidates: candidates.length,
        personalized: subscribedChannelIds.size > 0,
        subscriptions: subscriptions.length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});