import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// analyticsSync — pulls 7-day aggregated GA4 data for ALL properties in the connected
// Google Analytics account, stores daily snapshots in AnalyticsSnapshot.
// Called by the Persistent Sync workflow every 6 hours.

const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
const DATA_API = (propertyId) => `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
    if (!accessToken) return Response.json({ error: "Google Analytics not connected" }, { status: 400 });

    // List all GA4 properties
    const adminRes = await fetch(ADMIN_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const adminData = await adminRes.json();
    const properties = (adminData.accountSummaries || [])
      .flatMap(a => (a.propertySummaries || []).map(p => ({
        propertyId: p.resource?.match(/properties\/(\d+)/)?.[1],
        displayName: p.displayName,
      })))
      .filter(p => p.propertyId);

    if (properties.length === 0) {
      return Response.json({ synced: 0, message: "No GA4 properties found" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const results = [];

    for (const prop of properties) {
      let snapshotData;
      try {
        const reportRes = await fetch(DATA_API(prop.propertyId), {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            metrics: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "screenPageViews" },
              { name: "averageSessionDuration" },
              { name: "engagementRate" },
            ],
          }),
          signal: AbortSignal.timeout(15000),
        });
        const report = await reportRes.json();
        const totals = report.totals?.[0]?.metricValues || [];

        snapshotData = {
          property_id: prop.propertyId,
          property_name: prop.displayName,
          date: today,
          sessions: Number(totals[0]?.value || 0),
          total_users: Number(totals[1]?.value || 0),
          page_views: Number(totals[2]?.value || 0),
          average_session_duration: Number(totals[3]?.value || 0),
          engagement_rate: Number(totals[4]?.value || 0),
          synced_at: new Date().toISOString(),
        };
      } catch {
        // Skip properties that error (e.g. not yet configured)
        continue;
      }

      // Upsert
      const existing = await base44.entities.AnalyticsSnapshot.filter(
        { property_id: prop.propertyId, date: today }, { limit: 1 }
      );
      if (existing.items?.length > 0) {
        await base44.entities.AnalyticsSnapshot.update(existing.items[0].id, snapshotData);
      } else {
        await base44.entities.AnalyticsSnapshot.create(snapshotData);
      }

      results.push({ property_id: prop.propertyId, name: prop.displayName, sessions: snapshotData.sessions });
    }

    return Response.json({ synced: results.length, properties: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}