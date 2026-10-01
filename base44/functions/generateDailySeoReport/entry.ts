import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// generateDailySeoReport — reads recent SearchAnalyticsSnapshot records, computes
// 7-day trends, generates a natural-language health report, and stores it in
// SeoReport. Called daily by the Daily SEO Report workflow after searchConsoleSync.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Pull all snapshots from the last 14 days
    const { items: recentSnaps } = await base44.asServiceRole.entities.SearchAnalyticsSnapshot.filter(
      { date: { $gte: fourteenDaysAgo } },
      { sort: '-date', limit: 500 }
    );

    if (!recentSnaps || recentSnaps.length === 0) {
      return Response.json({ generated: 0, message: "No Search Console snapshots found — run searchConsoleSync first" });
    }

    // Group by site_url
    const bySite = {};
    for (const snap of recentSnaps) {
      const key = snap.site_url;
      if (!bySite[key]) bySite[key] = [];
      bySite[key].push(snap);
    }

    const reports = [];

    for (const [siteUrl, snaps] of Object.entries(bySite)) {
      // Today's snapshot (most recent)
      const todaySnap = snaps.find(s => s.date === today) || snaps[0];
      // Previous period: 7-14 days ago
      const prevSnaps = snaps.filter(s => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo);
      const prevTotals = prevSnaps.reduce(
        (acc, s) => {
          acc.clicks += s.clicks || 0;
          acc.impressions += s.impressions || 0;
          acc.position += s.position || 0;
          acc.ctr += s.ctr || 0;
          acc.count++;
          return acc;
        },
        { clicks: 0, impressions: 0, position: 0, ctr: 0, count: 0 }
      );

      const clicksToday = todaySnap.clicks || 0;
      const clicksPrev = prevTotals.count > 0 ? prevTotals.clicks / prevTotals.count : 0;
      const impressionsToday = todaySnap.impressions || 0;
      const impressionsPrev = prevTotals.count > 0 ? prevTotals.impressions / prevTotals.count : 0;
      const positionToday = todaySnap.position || 0;
      const positionPrev = prevTotals.count > 0 ? prevTotals.position / prevTotals.count : 0;
      const ctrToday = todaySnap.ctr || 0;
      const ctrPrev = prevTotals.count > 0 ? prevTotals.ctr / prevTotals.count : 0;

      const pctChange = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

      const clicksChange = pctChange(clicksToday, clicksPrev);
      const impressionsChange = pctChange(impressionsToday, impressionsPrev);
      const positionChange = positionToday - positionPrev; // negative = improvement
      const ctrChange = pctChange(ctrToday, ctrPrev);

      // Health assessment
      const healthNotes = [];
      let healthStatus = "healthy";

      if (clicksToday === 0 && impressionsToday === 0) {
        healthStatus = "no_data";
        healthNotes.push("No search data for today — Search Console may not have synced yet.");
      } else if (clicksChange < -20) {
        healthStatus = "needs_attention";
        healthNotes.push(`Clicks dropped ${clicksChange.toFixed(1)}% vs last week — investigate ranking changes or search intent shifts.`);
      } else if (positionToday > 30 && positionToday > 0) {
        healthStatus = "needs_attention";
        healthNotes.push(`Average position is ${positionToday.toFixed(1)} — content may need optimization to reach page 1.`);
      }

      if (impressionsChange > 20 && clicksChange < 0) {
        healthNotes.push("Impressions up but clicks down — CTR may be dropping. Review title tags and meta descriptions.");
      }
      if (positionChange < -2) {
        healthNotes.push(`Position improved by ${Math.abs(positionChange).toFixed(1)} spots — momentum building.`);
      }
      if (positionChange > 2) {
        healthNotes.push(`Position dropped ${positionChange.toFixed(1)} spots — check for algorithm changes or new competitors.`);
      }
      if (healthNotes.length === 0 && healthStatus === "healthy") {
        healthNotes.push("All metrics within normal range. No action needed.");
      }

      // Build natural-language summary
      const trend = (v) => v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`;
      const posTrend = (v) => v < 0 ? `improved ${Math.abs(v).toFixed(1)}` : `dropped ${v.toFixed(1)}`;

      const summary = [
        `SITE: ${siteUrl}`,
        `DATE: ${today}`,
        ``,
        `SEARCH PERFORMANCE (vs 7-day prior average):`,
        `  Clicks: ${clicksToday} (${trend(clicksChange)})`,
        `  Impressions: ${impressionsToday} (${trend(impressionsChange)})`,
        `  Average Position: ${positionToday.toFixed(1)} (${posTrend(positionChange)} spots)`,
        `  CTR: ${(ctrToday * 100).toFixed(2)}% (${trend(ctrChange)})`,
        ``,
        `HEALTH STATUS: ${healthStatus.toUpperCase()}`,
        ``,
        `NOTES:`,
        ...healthNotes.map(n => `  • ${n}`),
        ``,
        `TOP QUERIES:`,
        ...(todaySnap.top_queries || []).slice(0, 5).map(q => `  • "${q.query}" — ${q.clicks} clicks, ${q.impressions} impressions, pos ${q.position?.toFixed(1)}`),
        ``,
        `TOP PAGES:`,
        ...(todaySnap.top_pages || []).slice(0, 5).map(p => `  • ${p.page} — ${p.clicks} clicks, ${p.impressions} impressions, pos ${p.position?.toFixed(1)}`),
      ].join('\n');

      const reportData = {
        report_date: today,
        site_url: siteUrl,
        summary,
        clicks_today: clicksToday,
        clicks_prev: Math.round(clicksPrev),
        clicks_change_pct: Math.round(clicksChange * 10) / 10,
        impressions_today: impressionsToday,
        impressions_prev: Math.round(impressionsPrev),
        impressions_change_pct: Math.round(impressionsChange * 10) / 10,
        position_today: Math.round(positionToday * 10) / 10,
        position_prev: Math.round(positionPrev * 10) / 10,
        position_change: Math.round(positionChange * 10) / 10,
        ctr_today: ctrToday,
        ctr_prev: ctrPrev,
        ctr_change_pct: Math.round(ctrChange * 10) / 10,
        top_queries: (todaySnap.top_queries || []).slice(0, 10),
        top_pages: (todaySnap.top_pages || []).slice(0, 10),
        health_status: healthStatus,
        health_notes: healthNotes,
        generated_at: new Date().toISOString(),
      };

      // Upsert — update existing report for this site+date, or create new
      const existing = await base44.asServiceRole.entities.SeoReport.filter(
        { site_url: siteUrl, report_date: today },
        { limit: 1 }
      );
      if (existing.items?.length > 0) {
        await base44.asServiceRole.entities.SeoReport.update(existing.items[0].id, reportData);
      } else {
        await base44.asServiceRole.entities.SeoReport.create(reportData);
      }

      reports.push({ site_url: siteUrl, health_status: healthStatus, clicks: clicksToday });
    }

    return Response.json({
      generated: reports.length,
      reports,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}