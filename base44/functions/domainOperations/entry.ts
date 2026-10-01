import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// domainOperations — the Strategic Insights Domain Operations orchestrator.
// Handles domain intake, sitemap validation, Google Search Console + GA4 data
// retrieval, competitor intelligence, action generation, and the autonomous heartbeat.
// Called by the Domain Operations workflow every 6 hours, or on-demand by the agent.

const SC_API = "https://www.googleapis.com/webmasters/v3";
const GA4_ADMIN = "https://analyticsadmin.googleapis.com/v1beta";
const GA4_DATA = "https://analyticsdata.googleapis.com/v1beta";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeDomain(raw) {
  return String(raw || "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();
}

function fmtDate(d) { return d.toISOString().slice(0, 10); }

async function fetchSitemap(domain) {
  const candidates = [`https://${domain}/sitemap.xml`, `https://${domain}/sitemap_index.xml`];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("<loc>") || text.includes("<urlset") || text.includes("<sitemapindex")) {
          return { url, text, status: "found" };
        }
      }
    } catch {}
  }
  return { url: null, text: null, status: "missing" };
}

function parseSitemapUrls(xml) {
  const urls = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

async function getGscData(token, siteUrl, days = 28) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  const res = await fetch(`${SC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: fmtDate(start), endDate: fmtDate(end), dimensions: ["query", "page"], rowLimit: 100 }),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function getGa4Data(token, propertyId, days = 28) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400000);
  const res = await fetch(`${GA4_DATA}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: fmtDate(start), endDate: fmtDate(end) }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "engagementRate" }],
      dimensions: [{ name: "date" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 100,
    }),
    signal: AbortSignal.timeout(15000),
  });
  return res.json();
}

async function researchCompetitors(base44, domain, competitors, keywords) {
  const compStr = competitors.length > 0 ? competitors.join(", ") : "auto-discover 3-5 competitors";
  const kwStr = keywords.length > 0 ? keywords.join(", ") : "auto-discover based on the site's niche";
  const prompt = `You are an SEO competitor intelligence analyst. Analyze the competitive landscape for "${domain}".
Target keywords: ${kwStr}
Known competitors: ${compStr}

For each competitor, research their top ranking keywords, top pages, content strategy, title/meta strategy, content gaps we can exploit, and estimated SERP position. Use web search to find real, current data. Be specific and actionable.`;

  return await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        competitors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              top_keywords: { type: "array", items: { type: "string" } },
              top_pages: { type: "array", items: { type: "string" } },
              content_strategy: { type: "string" },
              title_strategy: { type: "string" },
              identified_gaps: { type: "array", items: { type: "string" } },
              serp_position: { type: "number" },
              analysis_summary: { type: "string" },
            },
          },
        },
        overall_strategy: { type: "string" },
        keyword_gaps: { type: "array", items: { type: "string" } },
      },
    },
  });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function addDomain(base44, rawDomain, params) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) return Response.json({ error: "Domain is required" }, { status: 400 });

  const existing = await base44.entities.DomainRegistry.filter({ domain }, { limit: 1 });
  if (existing.items?.length > 0) return Response.json({ error: "Domain already registered", id: existing.items[0].id }, { status: 409 });

  const canonical = `https://${domain}/`;
  const sitemap = await fetchSitemap(domain);
  const sitemapUrls = sitemap.text ? parseSitemapUrls(sitemap.text) : [];

  // Match GSC property
  let gscProp = null;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
    const r = await fetch(`${SC_API}/sites`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    const match = (d.siteEntry || []).find(s => s.siteUrl === `sc-domain:${domain}` || s.siteUrl === canonical || s.siteUrl === `https://www.${domain}/`);
    if (match) gscProp = match.siteUrl;
  } catch {}

  // Match GA4 property
  let ga4Id = null, ga4Name = null;
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
    const r = await fetch(`${GA4_ADMIN}/accounts/-/properties?pageSize=100`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
    const d = await r.json();
    const match = (d.properties || []).find(p => (p.displayName?.toLowerCase().includes(domain)) || (p.websiteUrl?.includes(domain)));
    if (match) { ga4Id = match.name?.replace("properties/", ""); ga4Name = match.displayName; }
  } catch {}

  const reg = await base44.entities.DomainRegistry.create({
    domain, canonical_url: canonical, status: "onboarding",
    search_console_property: gscProp, ga4_property_id: ga4Id, ga4_property_name: ga4Name,
    sitemap_url: sitemap.url, competitors: params.competitors || [], target_keywords: params.target_keywords || [],
    target_geography: params.target_geography || "US", analysis_frequency_hours: params.analysis_frequency_hours || 6,
  });

  await base44.entities.SitemapStatus.create({
    domain, sitemap_url: sitemap.url || "", status: sitemap.status, url_count: sitemapUrls.length,
    sampled_urls: sitemapUrls.slice(0, 50), dead_urls: [],
    issues: sitemap.status === "missing" ? ["No sitemap found at /sitemap.xml or /sitemap_index.xml"] : [],
    last_checked_at: new Date().toISOString(),
  });

  const actions = [];
  if (sitemap.status === "missing") actions.push({ domain, action_type: "fix_sitemap", priority: "critical", description: `No sitemap found at https://${domain}/sitemap.xml — create and deploy one, then submit to Google Search Console`, status: "pending", auto_executable: false });
  if (!gscProp) actions.push({ domain, action_type: "verify_ownership", priority: "high", description: `Add ${domain} to Google Search Console and verify ownership`, status: "pending", auto_executable: false });
  if (!ga4Id) actions.push({ domain, action_type: "create_ga4", priority: "high", description: `Create a GA4 property and data stream for ${domain}`, status: "pending", auto_executable: false });
  if (actions.length === 0) actions.push({ domain, action_type: "other", priority: "medium", description: "Onboarded — all systems connected. Run full analysis for baseline.", status: "completed", auto_executable: true, completed_at: new Date().toISOString() });

  for (const a of actions) await base44.entities.DomainAction.create(a);

  await base44.entities.DomainRegistry.update(reg.id, {
    status: actions.filter(a => a.priority === "critical" || a.priority === "high").length > 0 ? "needs_attention" : "active",
  });

  return Response.json({ success: true, domain, sitemap: { status: sitemap.status, url_count: sitemapUrls.length, url: sitemap.url }, search_console: gscProp ? "linked" : "not_found", ga4: ga4Id ? "linked" : "not_found", actions_created: actions.length });
}

async function analyzeDomain(base44, domain) {
  const regResult = await base44.entities.DomainRegistry.filter({ domain }, { limit: 1 });
  const reg = regResult.items?.[0];
  if (!reg) return Response.json({ error: "Domain not in registry" }, { status: 404 });

  const report = { domain, sections: {} };

  // 1. Sitemap
  const sitemap = await fetchSitemap(domain);
  const sitemapUrls = sitemap.text ? parseSitemapUrls(sitemap.text) : [];
  let deadUrls = [];
  for (const url of sitemapUrls.slice(0, 10)) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
      if (res.status >= 400) deadUrls.push(`${url} (${res.status})`);
    } catch { deadUrls.push(`${url} (timeout)`);
    }
  }
  const sitemapIssues = [];
  if (sitemap.status === "missing") sitemapIssues.push("No sitemap found");
  if (deadUrls.length > 0) sitemapIssues.push(`${deadUrls.length} dead URLs in sample`);
  if (sitemapUrls.length === 0 && sitemap.status === "found") sitemapIssues.push("Sitemap has no URLs");

  const existingSitemap = await base44.entities.SitemapStatus.filter({ domain }, { limit: 1, sort: "-last_checked_at" });
  const sitemapData = { domain, sitemap_url: sitemap.url || "", status: sitemap.status, url_count: sitemapUrls.length, sampled_urls: sitemapUrls.slice(0, 50), dead_urls: deadUrls, issues: sitemapIssues, last_checked_at: new Date().toISOString() };
  if (existingSitemap.items?.length > 0) await base44.entities.SitemapStatus.update(existingSitemap.items[0].id, sitemapData);
  else await base44.entities.SitemapStatus.create(sitemapData);
  report.sections.sitemap = { status: sitemap.status, url_count: sitemapUrls.length, dead_urls: deadUrls.length, issues: sitemapIssues };

  // 2. Search Console
  if (reg.search_console_property) {
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
      const raw = await getGscData(accessToken, reg.search_console_property, 28);
      const rows = raw.rows || [];
      const clicks = rows.reduce((s, r) => s + r.clicks, 0);
      const impressions = rows.reduce((s, r) => s + r.impressions, 0);
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const position = rows.length > 0 ? rows.reduce((s, r) => s + r.position, 0) / rows.length : 0;
      const topQueries = rows.slice(0, 20).map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position }));
      const topPages = rows.filter(r => r.keys[1]).slice(0, 20).map(r => ({ page: r.keys[1], clicks: r.clicks, impressions: r.impressions, position: r.position }));

      const today = fmtDate(new Date());
      const existing = await base44.entities.SearchAnalyticsSnapshot.filter({ site_url: reg.search_console_property, date: today }, { limit: 1 });
      const snap = { site_url: reg.search_console_property, date: today, clicks, impressions, ctr, position, top_queries: topQueries, top_pages: topPages, synced_at: new Date().toISOString() };
      if (existing.items?.length > 0) await base44.entities.SearchAnalyticsSnapshot.update(existing.items[0].id, snap);
      else await base44.entities.SearchAnalyticsSnapshot.create(snap);
      report.sections.search_console = { clicks, impressions, ctr, position, queries: topQueries.length };
    } catch (e) { report.sections.search_console = { error: e.message }; }
  }

  // 3. GA4
  if (reg.ga4_property_id) {
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
      const raw = await getGa4Data(accessToken, reg.ga4_property_id, 28);
      const rows = raw.rows || [];
      let sessions = 0, users = 0, pageViews = 0;
      for (const row of rows) {
        const mv = row.metricValues || [];
        sessions += mv[0]?.value ? Number(mv[0].value) : 0;
        users += mv[1]?.value ? Number(mv[1].value) : 0;
        pageViews += mv[2]?.value ? Number(mv[2].value) : 0;
      }
      const today = fmtDate(new Date());
      const existing = await base44.entities.AnalyticsSnapshot.filter({ property_id: reg.ga4_property_id, date: today }, { limit: 1 });
      const snap = { property_id: reg.ga4_property_id, property_name: reg.ga4_property_name || domain, date: today, sessions, total_users: users, page_views: pageViews, synced_at: new Date().toISOString() };
      if (existing.items?.length > 0) await base44.entities.AnalyticsSnapshot.update(existing.items[0].id, snap);
      else await base44.entities.AnalyticsSnapshot.create(snap);
      report.sections.analytics = { sessions, users, pageViews };
    } catch (e) { report.sections.analytics = { error: e.message }; }
  }

  // 4. Competitors
  try {
    const compResult = await researchCompetitors(base44, domain, reg.competitors || [], reg.target_keywords || []);
    const competitors = compResult.competitors || [];
    const today = fmtDate(new Date());
    for (const c of competitors) {
      await base44.entities.CompetitorSnapshot.create({
        source_domain: domain, competitor_domain: c.domain, snapshot_date: today,
        top_keywords: c.top_keywords || [], top_pages: c.top_pages || [],
        content_strategy: c.content_strategy || "", title_strategy: c.title_strategy || "",
        identified_gaps: c.identified_gaps || [], serp_position: c.serp_position || 0,
        analysis_summary: c.analysis_summary || "", synced_at: new Date().toISOString(),
      });
    }
    report.sections.competitors = { analyzed: competitors.length, gaps: compResult.keyword_gaps || [], strategy: compResult.overall_strategy || "" };
  } catch (e) { report.sections.competitors = { error: e.message }; }

  // 5. Actions
  const newActions = [];
  if (sitemap.status === "missing") newActions.push({ domain, action_type: "fix_sitemap", priority: "critical", description: "Create and deploy sitemap.xml", status: "pending", auto_executable: false });
  if (deadUrls.length > 0) newActions.push({ domain, action_type: "fix_technical", priority: "high", description: `Fix ${deadUrls.length} dead URLs: ${deadUrls.slice(0, 3).join(", ")}`, status: "pending", auto_executable: false });
  if (report.sections.search_console?.position && report.sections.search_console.position > 30) newActions.push({ domain, action_type: "improve_ctr", priority: "medium", description: `Avg SERP position ${report.sections.search_console.position.toFixed(1)} — improve titles & meta descriptions`, status: "pending", auto_executable: false });
  if (report.sections.competitors?.gaps?.length > 0) newActions.push({ domain, action_type: "create_content", priority: "high", description: `Create content for gaps: ${report.sections.competitors.gaps.slice(0, 5).join(", ")}`, status: "pending", auto_executable: false });
  if (!reg.search_console_property) newActions.push({ domain, action_type: "verify_ownership", priority: "high", description: "Add & verify domain in Google Search Console", status: "pending", auto_executable: false });
  if (!reg.ga4_property_id) newActions.push({ domain, action_type: "create_ga4", priority: "high", description: "Create GA4 property & data stream", status: "pending", auto_executable: false });
  for (const a of newActions) await base44.entities.DomainAction.create(a);
  report.sections.actions = { new_actions: newActions.length };

  // 6. Health score
  let score = 100;
  if (sitemap.status === "missing") score -= 30;
  if (deadUrls.length > 0) score -= 15;
  if (!reg.search_console_property) score -= 20;
  if (!reg.ga4_property_id) score -= 15;
  if (report.sections.search_console?.position > 30) score -= 10;
  if (newActions.filter(a => a.priority === "critical").length > 0) score -= 10;
  score = Math.max(0, score);

  await base44.entities.DomainRegistry.update(reg.id, {
    last_analyzed_at: new Date().toISOString(), health_score: score,
    next_action: newActions.length > 0 ? newActions[0].description : "All systems healthy — continue monitoring",
    status: score < 50 ? "needs_attention" : "active",
  });

  report.health_score = score;
  report.actions_created = newActions.length;
  return Response.json(report);
}

async function heartbeat(base44) {
  const result = await base44.entities.DomainRegistry.filter({ status: { $in: ["active", "needs_attention", "onboarding"] } }, { limit: 50 });
  const domains = result.items || [];
  const now = Date.now();
  const results = [];
  for (const reg of domains) {
    const last = reg.last_analyzed_at ? new Date(reg.last_analyzed_at).getTime() : 0;
    const hoursSince = (now - last) / 3600000;
    if (hoursSince >= (reg.analysis_frequency_hours || 6) || !reg.last_analyzed_at) {
      try {
        const r = await analyzeDomain(base44, reg.domain);
        const d = await r.json();
        results.push({ domain: reg.domain, health: d.health_score, actions: d.actions_created });
      } catch (e) { results.push({ domain: reg.domain, error: e.message }); }
    }
  }
  return Response.json({ processed: results.length, results });
}

async function listGscSites(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_search_console");
  const r = await fetch(`${SC_API}/sites`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
  const d = await r.json();
  return Response.json({ sites: d.siteEntry || [] });
}

async function listGa4Properties(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("google_analytics");
  const r = await fetch(`${GA4_ADMIN}/accounts/-/properties?pageSize=100`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) });
  const d = await r.json();
  return Response.json({ properties: d.properties || [] });
}

async function linkProperties(base44, domain, params) {
  const reg = (await base44.entities.DomainRegistry.filter({ domain }, { limit: 1 })).items?.[0];
  if (!reg) return Response.json({ error: "Domain not found" }, { status: 404 });
  await base44.entities.DomainRegistry.update(reg.id, {
    search_console_property: params.search_console_property || reg.search_console_property,
    ga4_property_id: params.ga4_property_id || reg.ga4_property_id,
    ga4_property_name: params.ga4_property_name || reg.ga4_property_name,
  });
  return Response.json({ success: true, domain });
}

// ─── Entry ────────────────────────────────────────────────────────────────────

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role || user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action = "heartbeat", domain, ...params } = body;

    switch (action) {
      case "add_domain": return await addDomain(base44, domain, params);
      case "analyze_domain": return await analyzeDomain(base44, domain);
      case "heartbeat": return await heartbeat(base44);
      case "list_gsc_sites": return await listGscSites(base44);
      case "list_ga4_properties": return await listGa4Properties(base44);
      case "link_properties": return await linkProperties(base44, domain, params);
      default: return Response.json({ error: "Unknown action: " + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}