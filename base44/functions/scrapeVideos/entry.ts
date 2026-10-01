import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Video scraper — finds YouTube videos from a channel URL, search query, or
// raw video-ID list, fetches metadata via YouTube oEmbed, and optionally
// bulk-creates Video records on the platform.

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

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
    const body = await req.json().catch(() => ({}));
    const { source, doImport, category, channelName } = body;

    // ── Extract video IDs ──
    let videoIds: string[] = [];

    if (Array.isArray(source)) {
      videoIds = source;
    } else if (typeof source === 'string' && source.includes('youtube.com')) {
      const r = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await r.text();
      videoIds = [...new Set([...html.matchAll(YT_ID_RE)].map((m) => m[1]))].slice(0, 30);
    } else if (typeof source === 'string') {
      const r = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(source)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const html = await r.text();
      videoIds = [...new Set([...html.matchAll(YT_ID_RE)].map((m) => m[1]))].slice(0, 30);
    }

    // ── Fetch metadata via oEmbed ──
    const videos: any[] = [];
    for (const id of videoIds) {
      const meta = await getMeta(id);
      if (meta) {
        videos.push({
          youtube_id: id,
          title: meta.title,
          channel_name: meta.author_name,
          thumbnail_url: meta.thumbnail_url,
          embed_url: `https://www.youtube.com/embed/${id}`,
        });
      }
    }

    // ── Optionally import into the platform ──
    if (doImport) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const channelList = await base44.entities.Channel.filter({ created_by: user.email }, '-created_date', 1);
      const channel = channelList?.[0];

      const records = videos.map((v) => ({
        title: v.title,
        description: `From ${v.channel_name} on YouTube`,
        url: v.embed_url,
        thumbnail_url: v.thumbnail_url,
        poster_url: v.thumbnail_url,
        category: category || 'howto',
        tags: ['scraped', 'youtube'],
        visibility: 'public',
        processing_status: 'done',
        channel_id: channel?.id || '',
        channel_name: channelName || v.channel_name,
        channel_avatar: '',
        views: Math.floor(Math.random() * 5000),
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        published_at: new Date().toISOString(),
      }));

      if (records.length > 0) {
        await base44.entities.Video.bulkCreate(records);
      }
      return Response.json({ videos, imported: records.length });
    }

    return Response.json({ videos, count: videos.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});