import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Globe, Activity, Target, Bot, Loader2, AlertCircle, CheckCircle2, Clock, Zap, TrendingUp, Search } from "lucide-react";
import AgentChat from "@/components/DomainOps/AgentChat";

const STATUS_COLORS = {
  active: "text-green-400 bg-green-500/10 border-green-500/30",
  needs_attention: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  onboarding: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  paused: "text-gray-400 bg-gray-500/10 border-gray-500/30",
  error: "text-red-400 bg-red-500/10 border-red-500/30",
};

const PRIORITY_COLORS = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

export default function DomainOps() {
  const [tab, setTab] = useState("domains");
  const [addDomain, setAddDomain] = useState("");
  const [addCompetitors, setAddCompetitors] = useState("");
  const [addKeywords, setAddKeywords] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [working, setWorking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const qc = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["domainRegistry"],
    queryFn: async () => (await base44.entities.DomainRegistry.filter({}, { sort: "-health_score", limit: 50 })).items,
  });

  const { data: actions } = useQuery({
    queryKey: ["domainActions"],
    queryFn: async () => (await base44.entities.DomainAction.filter({ status: "pending" }, { sort: "-created_date", limit: 100 })).items,
  });

  const { data: competitors } = useQuery({
    queryKey: ["competitorSnapshots"],
    queryFn: async () => (await base44.entities.CompetitorSnapshot.filter({}, { sort: "-synced_at", limit: 50 })).items,
  });

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center h-screen text-white/60">Admin access required.</div>;
  }

  const handleAddDomain = async () => {
    if (!addDomain.trim()) return;
    setWorking(true);
    setStatusMsg("");
    try {
      const res = await base44.functions.invoke("domainOperations", {
        action: "add_domain",
        domain: addDomain.trim(),
        competitors: addCompetitors.split(",").map(s => s.trim()).filter(Boolean),
        target_keywords: addKeywords.split(",").map(s => s.trim()).filter(Boolean),
      });
      setStatusMsg(`✓ Added ${addDomain.trim()} — sitemap: ${res.data?.sitemap?.status}, GSC: ${res.data?.search_console}, GA4: ${res.data?.ga4}`);
      setAddDomain(""); setAddCompetitors(""); setAddKeywords(""); setShowAddForm(false);
      qc.invalidateQueries({ queryKey: ["domainRegistry"] });
      qc.invalidateQueries({ queryKey: ["domainActions"] });
    } catch (e) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setWorking(false);
    }
  };

  const handleAnalyze = async (domain) => {
    setWorking(true);
    setStatusMsg(`Analyzing ${domain}...`);
    try {
      await base44.functions.invoke("domainOperations", { action: "analyze_domain", domain });
      setStatusMsg(`✓ Analysis complete for ${domain}`);
      qc.invalidateQueries({ queryKey: ["domainRegistry"] });
      qc.invalidateQueries({ queryKey: ["domainActions"] });
      qc.invalidateQueries({ queryKey: ["competitorSnapshots"] });
    } catch (e) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setWorking(false);
    }
  };

  const handleCompleteAction = async (actionId) => {
    await base44.entities.DomainAction.update(actionId, { status: "completed", completed_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["domainActions"] });
  };

  const tabs = [
    { id: "domains", label: "Domains", icon: Globe },
    { id: "actions", label: "Actions", icon: Zap },
    { id: "competitors", label: "Competitors", icon: Target },
    { id: "agent", label: "Agent", icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Strategic Insights</h1>
            <p className="text-xs text-white/50">Domain Operations Control Plane</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90">
          {statusMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${tab === t.id ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_0_16px_rgba(236,72,153,0.4)]" : "bg-white/5 text-white/60 border border-white/10"}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === "actions" && actions?.length > 0 && (
              <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{actions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
        {tab === "domains" && (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddForm(s => !s)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold shadow-[0_0_16px_rgba(236,72,153,0.4)]"
            >
              <Plus className="w-5 h-5" /> Add Domain
            </button>

            {showAddForm && (
              <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <input value={addDomain} onChange={e => setAddDomain(e.target.value)} placeholder="example.com" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50" />
                <input value={addCompetitors} onChange={e => setAddCompetitors(e.target.value)} placeholder="competitor1.com, competitor2.com (optional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50" />
                <input value={addKeywords} onChange={e => setAddKeywords(e.target.value)} placeholder="keyword1, keyword2 (optional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50" />
                <button onClick={handleAddDomain} disabled={working || !addDomain.trim()} className="w-full py-2.5 rounded-lg bg-white text-black font-bold disabled:opacity-40">
                  {working ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Register Domain"}
                </button>
              </div>
            )}

            {domainsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>
            ) : domains?.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No domains registered yet.</p>
                <p className="text-xs mt-1">Add a domain to get started.</p>
              </div>
            ) : (
              domains?.map(d => (
                <div key={d.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{d.domain}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{d.canonical_url}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[d.status] || STATUS_COLORS.active}`}>
                      {d.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/50">Health Score</span>
                        <span className={`font-bold ${d.health_score >= 70 ? "text-green-400" : d.health_score >= 40 ? "text-yellow-400" : "text-red-400"}`}>{d.health_score || 0}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${d.health_score >= 70 ? "bg-green-500" : d.health_score >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${d.health_score || 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border ${d.sitemap_url ? "text-green-400 bg-green-500/5 border-green-500/20" : "text-red-400 bg-red-500/5 border-red-500/20"}`}>
                      {d.sitemap_url ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} Sitemap
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border ${d.search_console_property ? "text-green-400 bg-green-500/5 border-green-500/20" : "text-red-400 bg-red-500/5 border-red-500/20"}`}>
                      {d.search_console_property ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} GSC
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border ${d.ga4_property_id ? "text-green-400 bg-green-500/5 border-green-500/20" : "text-red-400 bg-red-500/5 border-red-500/20"}`}>
                      {d.ga4_property_id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} GA4
                    </div>
                  </div>

                  {d.next_action && (
                    <div className="text-xs text-white/60 mb-3 flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-pink-500/60" />
                      <span>{d.next_action}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{d.last_analyzed_at ? `Analyzed ${new Date(d.last_analyzed_at).toLocaleDateString()}` : "Never analyzed"}</span>
                    <button onClick={() => handleAnalyze(d.domain)} disabled={working} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold disabled:opacity-40 transition-colors">
                      <TrendingUp className="w-3.5 h-3.5" /> Analyze
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "actions" && (
          <div className="space-y-2">
            {actions?.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500/50" />
                <p className="text-sm">No pending actions.</p>
              </div>
            ) : (
              actions?.map(a => (
                <div key={a.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.medium}`}>
                          {a.priority}
                        </span>
                        <span className="text-xs text-white/40">{a.domain}</span>
                      </div>
                      <p className="text-sm text-white/90">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-white/40">{a.action_type?.replace(/_/g, " ")}</span>
                    <button onClick={() => handleCompleteAction(a.id)} className="text-xs font-bold text-pink-400 hover:text-pink-300">
                      Mark Done →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "competitors" && (
          <div className="space-y-3">
            {competitors?.length === 0 ? (
              <div className="text-center text-white/40 py-12">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No competitor data yet.</p>
                <p className="text-xs mt-1">Run an analysis on a domain to discover competitors.</p>
              </div>
            ) : (
              competitors?.map(c => (
                <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-white">{c.competitor_domain}</h3>
                      <p className="text-xs text-white/40">vs {c.source_domain}</p>
                    </div>
                    {c.serp_position > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-white/40">SERP Pos</p>
                        <p className="font-bold text-pink-400">{c.serp_position.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                  {c.analysis_summary && <p className="text-xs text-white/70 mb-2 line-clamp-3">{c.analysis_summary}</p>}
                  {c.identified_gaps?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.identified_gaps.slice(0, 4).map((g, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">{g}</span>
                      ))}
                    </div>
                  )}
                  {c.top_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.top_keywords.slice(0, 5).map((k, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "agent" && <AgentChat />}
      </div>
    </div>
  );
}