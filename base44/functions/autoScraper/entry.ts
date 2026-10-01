import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Auto-scraper — discovers Be Near Me review candidates from YouTube.
// Invocation is authenticated and admin-only; scheduling belongs to the
// governed single-heartbeat orchestrator rather than a Base44 cron.

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

const TRENDING_QUERIES = [
  'random acts of kindness',
  'kindness challenge video',
  'wholesome moments',
  'feel good viral video',
  'positive news today',
  'community volunteering stories',
  'helping strangers kindness',
  'uplifting community stories',
  'friendship challenge kindness',
  'people doing good today',
];

async function getMeta(id: string) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 1. Collect video IDs from all trending queries
    const allIds = new Set<string>();
    for (const query of TRENDING_QUERIES) {
      try {
        const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const html = await r.text();
        for (const m of html.matchAll(YT_ID_RE)) allIds.add(m[1]);
      } catch {
        continue;
      }
    }

    // 2. Get existing YouTube video IDs to avoid duplicates
    let existingIds = new Set<string>();
    try {
      const existing = await base44.asServiceRole.entities.Video.filter(
        { url: { $regex: 'youtube.com/embed' } },
        '-created_date',
        500
      );
      for (const v of existing || []) {
        const match = v.url?.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (match) existingIds.add(match[1]);
      }
    } catch {
      // ignore — proceed without dedup
    }

    // 3. Filter to new videos only, cap at 25 per run
    const newIds = [...allIds].filter((id) => !existingIds.has(id)).slice(0, 25);

    // 4. Fetch metadata via oEmbed
    const videos: any[] = [];
    for (const id of newIds) {
      const meta = await getMeta(id);
      if (!meta?.title || !meta?.thumbnail_url) continue;

      try {
        const thumbCheck = await fetch(meta.thumbnail_url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        });
        if (!thumbCheck.ok) continue;
      } catch {
        continue;
      }

      videos.push({
        youtube_id: id,
        title: meta.title,
        channel_name: meta.author_name,
        thumbnail_url: meta.thumbnail_url,
      });
    }

    // 5. Import review candidates. Service-role access occurs only after
    // an authenticated admin caller has passed the gate above.
    let channel: any = null;
    try {
      const channels = await base44.entities.Channel.filter({ created_by: user.email }, '-created_date', 1);
      channel = channels?.[0];
    } catch {
      // A channel is optional for review candidates.
    }

    const records = videos.map((v) => ({
      title: v.title,
      description: `Review candidate from ${v.channel_name} on YouTube`,
      url: `https://www.youtube.com/embed/${v.youtube_id}`,
      thumbnail_url: v.thumbnail_url,
      poster_url: v.thumbnail_url,
      category: 'entertainment',
      tags: ['scraped', 'youtube', 'auto', 'trending', 'review_required'],
      visibility: 'unlisted',
      processing_status: 'done',
      channel_id: channel?.id || '',
      channel_name: v.channel_name,
      views: 0,
      likes: 0,
      dislikes: 0,
      comments_count: 0,
      published_at: new Date().toISOString(),
    }));

    if (records.length > 0) {
      await base44.asServiceRole.entities.Video.bulkCreate(records);
    }

    return Response.json({
      found: allIds.size,
      duplicates_filtered: allIds.size - newIds.length,
      new_videos: newIds.length,
      imported: records.length,
      queries_used: TRENDING_QUERIES.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});