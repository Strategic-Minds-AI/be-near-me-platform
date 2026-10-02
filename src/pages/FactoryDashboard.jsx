import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Factory, Boxes, Workflow, FileCode, ShieldCheck, Wrench,
  CloudUpload, Briefcase, Palette, BarChart3, CheckCircle2,
  AlertTriangle, XCircle, Clock, ArrowRight, Cpu, Package,
  FileCheck, GitBranch, Settings, Activity, Library,
} from 'lucide-react';

const MODULES = [
  { path: '/factory/generators', icon: Boxes, label: 'Generator Library', desc: '60 generator types across 8 categories' },
  { path: '/factory/studio', icon: Workflow, label: 'Generator Studio', desc: 'Visual DAG composer' },
  { path: '/factory/runs', icon: Activity, label: 'Run Console', desc: 'Live run monitoring' },
  { path: '/factory/artifacts', icon: Package, label: 'Artifact Explorer', desc: 'SHA-256 verified outputs' },
  { path: '/factory/validation', icon: FileCheck, label: 'Validation Center', desc: '13-layer validation mesh' },
  { path: '/factory/repair', icon: Wrench, label: 'Repair Center', desc: 'Targeted recursive repair' },
  { path: '/factory/provisioning', icon: CloudUpload, label: 'Provisioning Center', desc: 'Plan-first, approval-gated' },
  { path: '/factory/consulting', icon: Briefcase, label: 'AI Consulting Factory', desc: '34 evidence-based generators' },
  { path: '/factory/capabilities', icon: Library, label: 'Capability Registry', desc: '30 families · 486 templates' },
  { path: '/factory/frontend', icon: Palette, label: 'Frontend Factory', desc: 'Pattern registry + design compiler' },
  { path: '/factory/approvals', icon: ShieldCheck, label: 'Approvals', desc: 'Operator-gated actions' },
  { path: '/factory/usage', icon: BarChart3, label: 'Usage & Budgets', desc: 'Cost and quota tracking' },
  { path: '/factory/audit', icon: FileCode, label: 'Audit & Receipts', desc: 'Immutable audit trail' },
  { path: '/factory/settings', icon: Settings, label: 'Settings', desc: 'Adapter configuration' },
];

export default function FactoryDashboard() {
  const [stats, setStats] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [adapterHealth, setAdapterHealth] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [genCount, runCount, artifactCount, adapterCount, capCount, capFamilies, runs, adapters] = await Promise.all([
        base44.entities.GeneratorDefinition.count(),
        base44.entities.GeneratorRun.count(),
        base44.entities.Artifact.count(),
        base44.entities.AdapterDefinition.count(),
        base44.entities.CapabilityRegistry.count(),
        base44.entities.CapabilityRegistry.filter({}, { sort: 'family_id', limit: 50, fields: ['family_id', 'display_name', 'entry_count'] }),
        base44.entities.GeneratorRun.filter({}, { sort: '-created_date', limit: 5 }),
        base44.entities.AdapterDefinition.filter({}, { sort: 'adapter_key', limit: 50 }),
      ]);

      setStats({
        generators: genCount,
        runs: runCount,
        artifacts: artifactCount,
        adapters: adapterCount,
        capabilityFamilies: capCount,
        capabilityEntries: (capFamilies.items || []).reduce((sum, f) => sum + (f.entry_count || 0), 0),
      });
      setCapabilities(capFamilies.items || []);
      setRecentRuns(runs.items || []);
      setAdapterHealth(adapters.items || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const healthIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'not_configured': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--semantic-canvas))] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--semantic-canvas))] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[hsl(var(--semantic-surface))]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-ev-fab">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Universal Factory OS</h1>
              <p className="text-xs text-white/50">Generator Factory + Frontend Factory</p>
            </div>
          </div>
          <Link to="/builder">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Frontend Builder
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Generators', value: stats?.generators || 0, icon: Boxes, color: 'text-pink-400' },
            { label: 'Runs', value: stats?.runs || 0, icon: Activity, color: 'text-blue-400' },
            { label: 'Artifacts', value: stats?.artifacts || 0, icon: Package, color: 'text-green-400' },
            { label: 'Adapters', value: stats?.adapters || 0, icon: Cpu, color: 'text-purple-400' },
            { label: 'Capability Tpl.', value: stats?.capabilityEntries || 0, icon: Library, color: 'text-amber-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[hsl(var(--semantic-surface))] border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="text-lg font-bold mb-3">Factory Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((mod) => (
              <Link key={mod.path} to={mod.path}>
                <Card className="bg-[hsl(var(--semantic-surface))] border-white/10 p-4 hover:border-pink-500/30 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-pink-500/10 transition-colors">
                      <mod.icon className="w-5 h-5 text-white/70 group-hover:text-pink-400 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{mod.label}</h3>
                        <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{mod.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Capability Registry */}
        <div>
          <h2 className="text-lg font-bold mb-3">Capability Registry — {stats?.capabilityFamilies || 0} families · {stats?.capabilityEntries || 0} templates</h2>
          <Card className="bg-[hsl(var(--semantic-surface))] border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {capabilities.map((cap) => (
                <div key={cap.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                  <span className="text-sm font-medium truncate">{cap.display_name}</span>
                  <Badge variant="secondary" className="text-xs ml-2 shrink-0">{cap.entry_count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Adapter Health */}
        <div>
          <h2 className="text-lg font-bold mb-3">Adapter Health</h2>
          <Card className="bg-[hsl(var(--semantic-surface))] border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {adapterHealth.map((adapter) => (
                <div key={adapter.adapter_key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    {healthIcon(adapter.health_status)}
                    <span className="text-sm font-medium">{adapter.name}</span>
                  </div>
                  <Badge variant={adapter.health_status === 'healthy' ? 'default' : 'secondary'} className="text-xs">
                    {adapter.health_status === 'healthy' ? 'Healthy' : 'Not Configured'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Runs */}
        <div>
          <h2 className="text-lg font-bold mb-3">Recent Runs</h2>
          <Card className="bg-[hsl(var(--semantic-surface))] border-white/10 p-4">
            {recentRuns.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No runs yet. Create a generator and start a run.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{run.status}</Badge>
                      <span className="text-sm font-mono">{run.generator_key}</span>
                    </div>
                    <span className="text-xs text-white/40">
                      {new Date(run.created_date).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}