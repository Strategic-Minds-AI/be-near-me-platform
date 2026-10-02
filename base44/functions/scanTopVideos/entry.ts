import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// scanTopVideos — a user-facing viral skip-trace scanner. Any authenticated
// user can run it to discover what's trending right now across YouTube. It
// returns the discovered videos (titles, creators, categories) WITHOUT
// modifying any templates — it's a read-only trend radar.
//
// Powered by free YouTube search HTML parsing + oEmbed (no AI credits needed).
//
// Input: { query? }  — optional custom search query; defaults to a broad sweep
// Output: { discovered, total }

const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

const DEFAULT_QUERIES = [
  "viral short 2026",
  "trending tiktok compilation",
  "viral reel instagram 2026",
  "youtube shorts trending",
  "viral challenge 2026",
];

async function getVideoIds(query: string): Promise<string[]> {
  try {
    const r = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
    );
    const html = await r.text();
    return [...new Set([...html.matchAll(YT_ID_RE)].map((m) => m[1]))].slice(0, 8);
  } catch {
    return [];
  }
}

async function getMeta(id: string) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (/game|gaming|minecraft|fortnite|valorant/.test(t)) return 'gaming';
  if (/music|song|beat|rap|sing|cover/.test(t)) return 'music';
  if (/vlog|day in|life of|morning|routine/.test(t)) return 'vlogs';
  if (/tutorial|how to|guide|tips|learn/.test(t)) return 'howto';
  if (/funny|comedy|skit|parody|meme/.test(t)) return 'comedy';
  if (/food|cook|recipe|baking|kitchen/.test(t)) return 'food';
  if (/travel|trip|country|city|explore/.test(t)) return 'travel';
  if (/fashion|outfit|style|ootd|clothing/.test(t)) return 'fashion';
  if (/workout|gym|fitness|run|lift/.test(t)) return 'sports';
  if (/tech|gadget|phone|review|unbox/.test(t)) return 'tech';
  if (/art|draw|paint|design|creative/.test(t)) return 'art';
  if (/dog|cat|pet|animal|puppy/.test(t)) return 'pets';
  return 'entertainment';
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const customQuery = body.query?.trim();

    const queries = customQuery ? [customQuery] : DEFAULT_QUERIES;

    // Discover trending videos (parallelized)
    const idLists = await Promise.all(queries.map((q) => getVideoIds(q)));
    const allIds = idLists.flatMap((ids, i) => ids.map((id) => ({ id, q: queries[i] })));
    const metas = await Promise.all(allIds.map((x) => getMeta(x.id)));

    const discovered = [];
    allIds.forEach((x, i) => {
      if (metas[i]) {
        discovered.push({
          title: metas[i].title,
          channel: metas[i].author_name,
          thumbnail: metas[i].thumbnail_url,
          url: `https://www.youtube.com/watch?v=${x.id}`,
          category: guessCategory(metas[i].title),
          query: x.q,
        });
      }
    });

    // Group by category for the UI
    const byCategory = {};
    discovered.forEach((v) => {
      if (!byCategory[v.category]) byCategory[v.category] = [];
      byCategory[v.category].push(v);
    });

    return Response.json({
      discovered: discovered.length,
      total: discovered.length,
      videos: discovered,
      by_category: byCategory,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}