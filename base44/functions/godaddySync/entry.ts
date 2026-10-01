import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// godaddySync — pulls domain status, expiry, nameservers, and DNS records for ALL
// domains in the connected GoDaddy account, stores in DomainHealth.
// Called by the Persistent Sync workflow every 6 hours.
// Requires GODADDY_API_KEY and GODADDY_API_SECRET secrets.

const GODADDY_API = "https://api.godaddy.com/v1";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json({
        error: "GoDaddy API credentials not configured. Set GODADDY_API_KEY and GODADDY_API_SECRET in the Secrets dashboard.",
      }, { status: 400 });
    }

    const authHeader = `sso-key ${apiKey}:${apiSecret}`;

    // List all active domains
    const domainsRes = await fetch(`${GODADDY_API}/domains?statuses=ACTIVE`, {
      headers: { Authorization: authHeader },
      signal: AbortSignal.timeout(15000),
    });
    const domainsData = await domainsRes.json();

    if (!domainsRes.ok) {
      return Response.json({
        error: domainsData.message || `GoDaddy API returned ${domainsRes.status}`,
      }, { status: domainsRes.status });
    }

    if (!Array.isArray(domainsData) || domainsData.length === 0) {
      return Response.json({ synced: 0, message: "No active domains found in GoDaddy account" });
    }

    const results = [];

    for (const domain of domainsData) {
      const domainName = domain.domain;

      // Fetch DNS records
      let dnsRecords = [];
      try {
        const recordsRes = await fetch(`${GODADDY_API}/domains/${domainName}/records`, {
          headers: { Authorization: authHeader },
          signal: AbortSignal.timeout(15000),
        });
        if (recordsRes.ok) {
          dnsRecords = await recordsRes.json();
        }
      } catch {}

      const snapshotData = {
        domain: domainName,
        status: domain.status || "unknown",
        expires_at: domain.expires,
        created_at_domain: domain.createdAt,
        registrar: "GoDaddy",
        nameservers: domain.nameServers || [],
        dns_records: (dnsRecords || []).slice(0, 50).map(r => ({
          type: r.type, name: r.name, data: r.data, ttl: r.ttl,
        })),
        locked: domain.locked || false,
        synced_at: new Date().toISOString(),
      };

      // Upsert by domain name
      const existing = await base44.entities.DomainHealth.filter({ domain: domainName }, { limit: 1 });
      if (existing.items?.length > 0) {
        await base44.entities.DomainHealth.update(existing.items[0].id, snapshotData);
      } else {
        await base44.entities.DomainHealth.create(snapshotData);
      }

      results.push({ domain: domainName, status: snapshotData.status });
    }

    return Response.json({ synced: results.length, domains: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}