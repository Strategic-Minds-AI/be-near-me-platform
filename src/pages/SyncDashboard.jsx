import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Gauge,
  Search,
  Globe,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  Server,
  Lock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

function SyncCard({ icon: Icon, title, onSync, syncing, children, accent }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-semibold text-white">{title}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="text-white hover:bg-white/20"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
      </div>
      {children}
    </div>
  );
}

function DomainRow({ domain }) {
  const [expanded, setExpanded] = useState(false);
  const expiringSoon = domain.expires_at && new Date(domain.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-white/80" /> : <ChevronRight className="w-4 h-4 text-white/80" />}
        <Globe className="w-4 h-4 text-pink-400 flex-shrink-0" />
        <span className="text-white font-medium text-sm flex-1 text-left">{domain.domain}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${domain.status === "ACTIVE" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
          {domain.status}
        </span>
        {domain.locked && <Lock className="w-3.5 h-3.5 text-white/80" />}
        {expiringSoon && <AlertCircle className="w-4 h-4 text-amber-400" />}
      </button>
      {expanded && (
        <div className="px-8 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/80 text-xs">Expires</p>
              <p className={`text-white ${expiringSoon ? "text-amber-400" : ""}`}>{fmtDate(domain.expires_at)}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Registered</p>
              <p className="text-white">{fmtDate(domain.created_at_domain)}</p>
            </div>
          </div>
          {domain.nameservers?.length > 0 && (
            <div>
              <p className="text-white/80 text-xs mb-1">Nameservers</p>
              <div className="flex flex-wrap gap-1.5">
                {domain.nameservers.map((ns, i) => (
                  <span key={i} className="text-xs bg-white/5 text-white px-2 py-0.5 rounded-md">{ns}</span>
                ))}
              </div>
            </div>
          )}
          {domain.dns_records?.length > 0 && (
            <div>
              <p className="text-white/80 text-xs mb-1">DNS Records ({domain.dns_records.length})</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {domain.dns_records.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-white/5 rounded px-2 py-1">
                    <span className="text-pink-400 font-mono w-16">{r.type}</span>
                    <span className="text-white flex-1 truncate">{r.name}</span>
                    <span className="text-white truncate max-w-[140px]">{r.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-white/70 text-xs">Last synced: {fmtDateTime(domain.synced_at)}</p>
        </div>
      )}
    </div>
  );
}

export default function SyncDashboard() {
  const queryClient = useQueryClient();
  const [syncingTarget, setSyncingTarget] = useState(null);

  const userQ = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const user = userQ.data;

  const analyticsQ = useQuery({
    queryKey: ["analyticsSnapshots"],
    queryFn: async () => {
      const res = await base44.entities.AnalyticsSnapshot.filter({}, { sort: "-date", limit: 50 });
      return res.items || [];
    },
    enabled: !!user && user.role === "admin",
  });

  const searchQ = useQuery({
    queryKey: ["searchSnapshots"],
    queryFn: async () => {
      const res = await base44.entities.SearchAnalyticsSnapshot.filter({}, { sort: "-date", limit: 50 });
      return res.items || [];
    },
    enabled: !!user && user.role === "admin",
  });

  const domainsQ = useQuery({
    queryKey: ["domainHealth"],
    queryFn: async () => {
      const res = await base44.entities.DomainHealth.filter({}, { sort: "-synced_at", limit: 50 });
      return res.items || [];
    },
    enabled: !!user && user.role === "admin",
  });

  const runSync = async (funcName) => {
    setSyncingTarget(funcName);
    try {
      await base44.functions.invoke(funcName, {});
      await queryClient.invalidateQueries();
    } catch (e) {
      console.error(e);
    }
    setSyncingTarget(null);
  };

  if (userQ.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>;
  }
  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertCircle className="w-10 h-10 text-pink-500" />
        <p className="text-white">Sync dashboard is admin-only.</p>
      </div>
    );
  }

  const analyticsData = analyticsQ.data || [];
  const searchData = searchQ.data || [];
  const domainData = domainsQ.data || [];

  const analyticsByProp = {};
  analyticsData.forEach(s => {
    if (!analyticsByProp[s.property_id]) analyticsByProp[s.property_id] = { name: s.property_name, snapshots: [] };
    analyticsByProp[s.property_id].snapshots.push(s);
  });

  const searchBySite = {};
  searchData.forEach(s => {
    if (!searchBySite[s.site_url]) searchBySite[s.site_url] = [];
    searchBySite[s.site_url].push(s);
  });

  const latestSync = Math.max(
    ...[analyticsData, searchData, domainData].flat().map(d => new Date(d?.synced_at || 0).getTime() || 0)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Server className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Persistent Sync</h1>
          <p className="text-sm text-white">Google Analytics · Search Console · GoDaddy — synced every 6 hours</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 mb-6 text-xs text-white">
        <Calendar className="w-4 h-4 text-pink-400" />
        Last sync: {latestSync > 0 ? fmtDateTime(new Date(latestSync).toISOString()) : "never — run a sync below"}
      </div>

      <SyncCard
        icon={Gauge}
        title="Google Analytics"
        accent="bg-gradient-to-br from-pink-500 to-fuchsia-600"
        onSync={() => runSync("analyticsSync")}
        syncing={syncingTarget === "analyticsSync"}
      >
        {analyticsQ.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-pink-500" /></div>
        ) : Object.keys(analyticsByProp).length === 0 ? (
          <p className="text-white/80 text-sm py-4 text-center">No analytics data yet — click "Sync now" to pull from GA4.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(analyticsByProp).map(([pid, { name, snapshots }]) => {
              const latest = snapshots[0];
              return (
                <div key={pid} className="bg-white/5 rounded-xl p-3">
                  <p className="text-white font-medium text-sm mb-2">{name || pid}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-white/80">Sessions</p><p className="text-white font-bold">{fmtNum(latest.sessions)}</p></div>
                    <div><p className="text-white/80">Users</p><p className="text-white font-bold">{fmtNum(latest.total_users)}</p></div>
                    <div><p className="text-white/80">Page views</p><p className="text-white font-bold">{fmtNum(latest.page_views)}</p></div>
                  </div>
                  <p className="text-white/70 text-xs mt-2">{fmtDate(latest.date)} · {fmtDateTime(latest.synced_at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </SyncCard>

      <div className="mt-4">
        <SyncCard
          icon={Search}
          title="Google Search Console"
          accent="bg-gradient-to-br from-blue-500 to-cyan-600"
          onSync={() => runSync("searchConsoleSync")}
          syncing={syncingTarget === "searchConsoleSync"}
        >
          {searchQ.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-pink-500" /></div>
          ) : Object.keys(searchBySite).length === 0 ? (
            <p className="text-white/80 text-sm py-4 text-center">No search data yet — click "Sync now" to pull from Search Console.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(searchBySite).map(([siteUrl, snapshots]) => {
                const latest = snapshots[0];
                return (
                  <div key={siteUrl} className="bg-white/5 rounded-xl p-3">
                    <p className="text-white font-medium text-sm mb-2 truncate">{siteUrl}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><span className="text-white/80">Clicks </span><span className="text-white font-bold">{fmtNum(latest.clicks)}</span></div>
                      <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400" /><span className="text-white font-bold">{fmtNum(latest.impressions)}</span></div>
                      <div><span className="text-white/80">CTR </span><span className="text-white font-bold">{fmtPct(latest.ctr)}</span></div>
                      <div><span className="text-white/80">Pos </span><span className="text-white font-bold">{latest.position?.toFixed(1)}</span></div>
                    </div>
                    {latest.top_queries?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-white/80 text-xs mb-1">Top queries</p>
                        <div className="flex flex-wrap gap-1">
                          {latest.top_queries.slice(0, 5).map((q, i) => (
                            <span key={i} className="text-xs bg-white/5 text-white px-2 py-0.5 rounded-md">{q.query} ({q.clicks})</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-white/70 text-xs mt-2">{fmtDate(latest.date)} · {fmtDateTime(latest.synced_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </SyncCard>
      </div>

      <div className="mt-4">
        <SyncCard
          icon={Globe}
          title="GoDaddy Domains"
          accent="bg-gradient-to-br from-emerald-500 to-teal-600"
          onSync={() => runSync("godaddySync")}
          syncing={syncingTarget === "godaddySync"}
        >
          {domainsQ.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-pink-500" /></div>
          ) : domainData.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-white/80 text-sm mb-2">No domain data yet.</p>
              <p className="text-white/70 text-xs">Make sure GODADDY_API_KEY and GODADDY_API_SECRET are set in Secrets, then click "Sync now".</p>
            </div>
          ) : (
            <div>
              {domainData.map(d => <DomainRow key={d.id} domain={d} />)}
            </div>
          )}
        </SyncCard>
      </div>
    </div>
  );
}