import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Auto-scraper — runs on a daily schedule to find trending YouTube videos
// across multiple search queries, deduplicate against existing imports,
// and bulk-create new Video records. Designed to be called by a workflow.

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

const TRENDING_QUERIES = [
  'trending viral videos today',
  'most popular videos this week',
  'inspirational viral video',
  'feel good viral video',
  'kindness challenge video',
  'epoxy floor installation tutorial',
  'concrete polishing tutorial',
  'DIY home improvement viral',
  'wholesome moments',
  'positive news today',
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
      const existing = await base44.entities.Video.filter(
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
      if (meta) {
        videos.push({
          youtube_id: id,
          title: meta.title,
          channel_name: meta.author_name,
          thumbnail_url: meta.thumbnail_url,
        });
      }
    }

    // 5. Import to database
    let user: any = null;
    try {
      user = await base44.auth.me();
    } catch {
      // workflow context — no user session
    }

    let channel: any = null;
    if (user) {
      try {
        const channels = await base44.entities.Channel.filter({ created_by: user.email }, '-created_date', 1);
        channel = channels?.[0];
      } catch {
        // ignore
      }
    }

    const records = videos.map((v) => ({
      title: v.title,
      description: `Auto-imported trending video from ${v.channel_name}`,
      url: `https://www.youtube.com/embed/${v.youtube_id}`,
      thumbnail_url: v.thumbnail_url,
      poster_url: v.thumbnail_url,
      category: 'entertainment',
      tags: ['scraped', 'youtube', 'auto', 'trending'],
      visibility: 'public',
      processing_status: 'done',
      channel_id: channel?.id || '',
      channel_name: v.channel_name,
      views: Math.floor(Math.random() * 10000) + 100,
      likes: 0,
      dislikes: 0,
      comments_count: 0,
      published_at: new Date().toISOString(),
    }));

    if (records.length > 0) {
      await base44.entities.Video.bulkCreate(records);
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