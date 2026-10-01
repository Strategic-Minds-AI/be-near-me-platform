import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// qualityGate — scans all public videos, validates every URL (video + thumbnail),
// and unpublishes any that fail. Called by the scheduled Quality Gate workflow
// every 6 hours, and can be triggered manually from the admin panel.

async function checkVideoUrl(url: string): Promise<string[]> {
  if (!url) return ['No video URL'];
  const issues: string[] = [];

  if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
    const videoId = url.match(/(?:embed\/|youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)?.[1];
    if (!videoId) {
      issues.push('Invalid YouTube ID');
    } else {
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!r.ok) issues.push('YouTube video unavailable');
      } catch {
        issues.push('YouTube check failed');
      }
    }
  } else {
    try {
      const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      if (!r.ok) issues.push(`Video URL status ${r.status}`);
    } catch {
      try {
        const r = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(10000) });
        if (!r.ok && r.status !== 206) issues.push('Video URL inaccessible');
      } catch {
        issues.push('Video URL inaccessible');
      }
    }
  }
  return issues;
}

async function checkImageUrl(url: string): Promise<string[]> {
  if (!url) return ['No thumbnail URL'];
  const issues: string[] = [];
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (!r.ok) issues.push(`Thumbnail status ${r.status}`);
  } catch {
    try {
      const r = await fetch(url, { headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(10000) });
      if (!r.ok && r.status !== 206) issues.push('Thumbnail inaccessible');
    } catch {
      issues.push('Thumbnail inaccessible');
    }
  }
  return issues;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scan up to 200 public videos per run (stays within timeout)
    const videos = await base44.entities.Video.filter({ visibility: 'public' }, '-created_date', 200);

    let checked = 0;
    let failed = 0;
    let unpublished = 0;
    const failedList: any[] = [];

    for (const video of videos) {
      checked++;
      const issues: string[] = [];

      // Validate video URL
      issues.push(...(await checkVideoUrl(video.url)));

      // Validate thumbnail URL
      issues.push(...(await checkImageUrl(video.thumbnail_url)));

      // Validate required metadata
      if (!video.title) issues.push('Missing title');

      if (issues.length > 0) {
        failed++;
        failedList.push({ id: video.id, title: video.title, issues });
        try {
          await base44.entities.Video.update(video.id, { visibility: 'private' });
          unpublished++;
        } catch {
          // skip if update fails
        }
      }
    }

    return Response.json({
      checked,
      passed: checked - failed,
      failed,
      unpublished,
      failed_videos: failedList.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});