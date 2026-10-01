import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// validateMedia — reusable quality check for any video or image URL.
// Returns { valid, issues } so callers can decide whether to publish.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({})) || {};
    const { url, type } = body; // type: 'video' | 'image'

    if (!url) return Response.json({ valid: false, issues: ['No URL provided'] });

    const issues: string[] = [];

    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
      // YouTube embed — validate via oEmbed API
      const videoId = url.match(/(?:embed\/|youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)?.[1];
      if (!videoId) {
        issues.push('Invalid YouTube video ID');
      } else {
        try {
          const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (!r.ok) {
            issues.push('YouTube video unavailable or private');
          } else {
            const data = await r.json();
            if (!data.title) issues.push('YouTube video has no title');
            if (!data.thumbnail_url) issues.push('YouTube video has no thumbnail');
          }
        } catch {
          issues.push('YouTube validation request failed');
        }
      }
    } else {
      // Direct URL — HEAD request to check accessibility and content type
      try {
        const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        if (!r.ok) {
          issues.push(`URL returned status ${r.status}`);
        } else {
          const ct = r.headers.get('content-type') || '';
          if (type === 'video' && !ct.startsWith('video/')) {
            issues.push(`Expected video content-type, got ${ct}`);
          }
          if (type === 'image' && !ct.startsWith('image/')) {
            issues.push(`Expected image content-type, got ${ct}`);
          }
        }
      } catch {
        // Some servers don't support HEAD — try GET with range
        try {
          const r = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(10000) });
          if (!r.ok && r.status !== 206) {
            issues.push(`URL not accessible (status ${r.status})`);
          }
        } catch {
          issues.push('URL not accessible');
        }
      }
    }

    return Response.json({ valid: issues.length === 0, issues, url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});