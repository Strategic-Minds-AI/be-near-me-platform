import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// searchConsoleSync — pulls search performance data for ALL sites in the connected
// Google Search Console account, stores daily snapshots in SearchAnalyticsSnapshot.
// Called by the Persistent Sync workflow every 6 hours.

const SC_API = "https://www.googleapis.com/webmasters/v3";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    if (!accessToken) return Response.json({ error: "Google Search Console not connected" }, { status: 400 });

    // List all sites in the account
    const sitesRes = await fetch(`${SC_API}/sites`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];

    if (sites.length === 0) {
      return Response.json({ synced: 0, message: "No sites found in Search Console account" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const results = [];

    for (const site of sites) {
      const siteUrl = site.siteUrl;

      // Fetch top queries for today
      let topQueries = [];
      try {
        const qRes = await fetch(`${SC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: today, endDate: today, dimensions: ["query"], rowLimit: 20 }),
          signal: AbortSignal.timeout(15000),
        });
        const qData = await qRes.json();
        topQueries = (qData.rows || []).map(r => ({
          query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position,
        }));
      } catch {}

      // Fetch top pages for today
      let topPages = [];
      try {
        const pRes = await fetch(`${SC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: today, endDate: today, dimensions: ["page"], rowLimit: 20 }),
          signal: AbortSignal.timeout(15000),
        });
        const pData = await pRes.json();
        topPages = (pData.rows || []).map(r => ({
          page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position,
        }));
      } catch {}

      // Aggregate totals from queries
      const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);
      const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);
      const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const avgPosition = topQueries.length > 0
        ? topQueries.reduce((s, q) => s + q.position, 0) / topQueries.length
        : 0;

      const snapshotData = {
        site_url: siteUrl,
        date: today,
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: avgCtr,
        position: avgPosition,
        top_queries: topQueries,
        top_pages: topPages,
        synced_at: new Date().toISOString(),
      };

      // Upsert — update existing snapshot for this site+date, or create new
      const existing = await base44.entities.SearchAnalyticsSnapshot.filter(
        { site_url: siteUrl, date: today }, { limit: 1 }
      );
      if (existing.items?.length > 0) {
        await base44.entities.SearchAnalyticsSnapshot.update(existing.items[0].id, snapshotData);
      } else {
        await base44.entities.SearchAnalyticsSnapshot.create(snapshotData);
      }

      results.push({ site_url: siteUrl, clicks: totalClicks, impressions: totalImpressions });
    }

    return Response.json({ synced: results.length, sites: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}