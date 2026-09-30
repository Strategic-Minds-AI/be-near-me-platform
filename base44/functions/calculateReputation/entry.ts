import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Calculates creator reputation score for a channel
// Score inputs: upload_consistency, watch_time, engagement, retention, growth, strikes

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const channelId = body.channelId;

    // Fetch channel and its videos
    const [channels, videos, reports] = await Promise.all([
      base44.entities.Channel.filter({ id: channelId || undefined, created_by: channelId ? undefined : user.email }),
      base44.entities.Video.filter({ created_by: user.email }, '-created_date', 50),
      base44.entities.Report.filter({ created_by: user.email }),
    ]);

    const channel = channels?.[0];
    if (!channel) return Response.json({ error: 'Channel not found' }, { status: 404 });

    // --- Upload Consistency Score (0-100) ---
    // Based on: how many videos uploaded in last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentVideos = videos.filter(v => new Date(v.created_date) > ninetyDaysAgo);
    const uploadConsistency = Math.min(recentVideos.length * 8, 100); // 12.5 vids = 100

    // --- Watch Time Score (0-100) ---
    const totalWatchHours = (channel.total_watch_time || 0) / 3600;
    const watchTimeScore = Math.min((totalWatchHours / 4000) * 100, 100); // 4000h = 100

    // --- Engagement Score (0-100) ---
    const totalViews = videos.reduce((s, v) => s + (v.views || 0), 0);
    const totalLikes = videos.reduce((s, v) => s + (v.likes || 0), 0);
    const totalComments = videos.reduce((s, v) => s + (v.comments_count || 0), 0);
    const likeRatio = totalViews > 0 ? (totalLikes / totalViews) : 0;
    const commentRatio = totalViews > 0 ? (totalComments / totalViews) : 0;
    const engagementScore = Math.min((likeRatio * 200 + commentRatio * 500) * 100, 100);

    // --- Growth Score (0-100) ---
    const subs = channel.subscribers_count || 0;
    const growthScore = Math.min((Math.log10(Math.max(subs, 1)) / 6) * 100, 100); // log scale up to 1M

    // --- Strike Penalty ---
    const strikes = channel.strikes || 0;
    const strikePenalty = strikes * 20; // -20 per strike

    // --- Reports Penalty ---
    const reportsPenalty = Math.min((reports?.length || 0) * 5, 30);

    // --- Final Score ---
    const rawScore = (
      uploadConsistency * 0.25 +
      watchTimeScore * 0.20 +
      engagementScore * 0.25 +
      growthScore * 0.20 +
      50 * 0.10 // retention placeholder
    ) - strikePenalty - reportsPenalty;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Determine level
    let level = 'bronze';
    if (score >= 90) level = 'platinum';
    else if (score >= 70) level = 'gold';
    else if (score >= 50) level = 'silver';
    else if (score >= 25) level = 'bronze';

    const monetizationEligible = subs >= 1000 && totalWatchHours >= 4000 && strikes === 0;
    const featuredEligible = score >= 70 && strikes === 0;

    // Upsert reputation record
    const existing = await base44.asServiceRole.entities.CreatorReputation.filter({ channel_id: channel.id });
    const reputationData = {
      channel_id: channel.id,
      score,
      level,
      upload_consistency: Math.round(uploadConsistency),
      watch_time_score: Math.round(watchTimeScore),
      engagement_score: Math.round(engagementScore),
      growth_score: Math.round(growthScore),
      strikes,
      reports_count: reports?.length || 0,
      monetization_eligible: monetizationEligible,
      featured_eligible: featuredEligible,
      last_calculated: new Date().toISOString(),
    };

    if (existing?.[0]) {
      await base44.asServiceRole.entities.CreatorReputation.update(existing[0].id, reputationData);
    } else {
      await base44.asServiceRole.entities.CreatorReputation.create(reputationData);
    }

    return Response.json({ reputation: reputationData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});