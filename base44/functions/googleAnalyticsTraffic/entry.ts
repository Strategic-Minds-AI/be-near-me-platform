import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
const DATA_API = (propertyId) => `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
const RT_API = (propertyId) => `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;

async function gaFetch(url, token, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `GA API ${res.status}`);
  return data;
}

function extractPropertyId(resource) {
  // resource looks like "properties/123456789"
  const m = String(resource || "").match(/properties\/(\d+)/);
  return m ? m[1] : null;
}

function fmtDate(d) {
  // GA returns "YYYYMMDD" -> "YYYY-MM-DD"
  if (!d || d.length !== 8) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
    if (!accessToken) return Response.json({ error: "Google Analytics not connected" }, { status: 400 });

    const body = await req.json().catch(() => ({})) || {};
    let propertyId = body.propertyId;

    // Discover available GA4 properties
    const adminRes = await fetch(ADMIN_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const adminData = await adminRes.json();
    const properties = (adminData.accountSummaries || [])
      .flatMap((a) => (a.propertySummaries || []).map((p) => ({
        propertyId: extractPropertyId(p.property),
        displayName: p.displayName,
        account: a.account?.displayName,
      })))
      .filter((p) => p.propertyId);

    if (properties.length === 0) {
      return Response.json({ error: "No GA4 properties found in this Google Analytics account", properties: [] }, { status: 404 });
    }

    if (!propertyId) propertyId = properties[0].propertyId;

    // Real-time active users
    const realtime = await gaFetch(RT_API(propertyId), accessToken, {
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
    });

    // 7-day trend
    const report = await gaFetch(DATA_API(propertyId), accessToken, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "engagementRate" },
      ],
      dimensions: [{ name: "date" }],
      orderBys: [{ dimension: { orderType: "ALPHANUMERIC", dimensionName: "date" } }],
    });

    const dimHeaders = (report.dimensionHeaders || []).map((h) => h.name);
    const metricHeaders = (report.metricHeaders || []).map((h) => h.name);
    const trend = (report.rows || []).map((r) => {
      const dimVals = r.dimensionValues || [];
      const metVals = r.metricValues || [];
      const row = {};
      dimHeaders.forEach((h, i) => {
        row[h] = h === "date" ? fmtDate(dimVals[i]?.value) : dimVals[i]?.value;
      });
      metricHeaders.forEach((h, i) => {
        row[h] = Number(metVals[i]?.value || 0);
      });
      return row;
    });

    // Totals
    const totals = (report.totals || [{}])[0]?.metricValues || [];
    const totalsObj = {};
    metricHeaders.forEach((h, i) => {
      totalsObj[h] = Number(totals[i]?.value || 0);
    });

    const rtActive = Number(realtime.totals?.[0]?.metricValues?.[0]?.value || 0);
    const rtEvents = Number(realtime.totals?.[0]?.metricValues?.[1]?.value || 0);

    return Response.json({
      properties,
      selectedPropertyId: propertyId,
      realtime: { activeUsers: rtActive, eventCount: rtEvents },
      totals: totalsObj,
      trend,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}