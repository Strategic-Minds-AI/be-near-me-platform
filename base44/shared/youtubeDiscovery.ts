// Shared YouTube discovery helpers — used by viralSkipTrace and ingestTrendingSystem.
// Free YouTube search HTML parsing + oEmbed (no API key needed).

export const YT_ID_RE = /watch\?v=([a-zA-Z0-9_-]{11})/g;

export async function getVideoIds(query, limit = 5) {
  try {
    const r = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
    );
    const html = await r.text();
    return [...new Set([...html.matchAll(YT_ID_RE)].map((m) => m[1]))].slice(0, limit);
  } catch {
    return [];
  }
}

export async function getMeta(id) {
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

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

export async function discoverVideos(queries, perQuery = 5) {
  const idLists = await Promise.all(queries.map((q) => getVideoIds(q, perQuery)));
  const allIds = idLists.flatMap((ids, i) => ids.map((id) => ({ id, q: queries[i] })));
  const metas = await Promise.all(allIds.map((x) => getMeta(x.id)));
  const discovered = [];
  allIds.forEach((x, i) => {
    if (metas[i]) {
      discovered.push({
        title: metas[i].title,
        channel: metas[i].author_name,
        thumbnail: metas[i].thumbnail_url,
        query: x.q,
      });
    }
  });
  return discovered;
}