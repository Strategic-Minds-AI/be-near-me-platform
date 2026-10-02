import React, { useState, useMemo, useEffect } from "react";
import { LayoutTemplate, Search, Smartphone, Monitor, Workflow, X, SlidersHorizontal, FileText } from "lucide-react";
import { PREVIEW_STYLES } from "@/lib/gallery/previewStyles.js";
import { GALLERY_FAMILIES, familyFor, renderPreview } from "@/lib/gallery/previewRenderer.js";
import {
  loadConfig,
  saveConfig,
  themeToCssVars,
  DEFAULT_CONFIG,
  loadFont,
  PRESETS,
  FONT_OPTIONS,
} from "@/lib/gallery/studioConfig.js";
import DeviceFrame from "@/components/gallery/DeviceFrame.jsx";
import StudioControls from "@/components/gallery/StudioControls.jsx";
import StudioGenerators from "@/components/gallery/StudioGenerators.jsx";

const TABS = [
  { key: "all", label: "All", icon: LayoutTemplate },
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "mobile", label: "Mobile", icon: Smartphone },
  { key: "recipes", label: "Recipes", icon: Workflow },
];

function TemplatePreview({ template, platform, displayW = 232, config }) {
  const { frame, designW, designH, html } = renderPreview(template, platform, config);
  return (
    <DeviceFrame type={frame} designW={designW} designH={designH} displayW={displayW}>
      <div style={{ width: designW, height: designH }} dangerouslySetInnerHTML={{ __html: html }} />
    </DeviceFrame>
  );
}

function TemplateDetailModal({ template, config, themeVars, onChange, onClose }) {
  const [tab, setTab] = useState("customize");
  if (!template) return null;
  const platform = familyFor(template);
  const displayW = platform === "mobile" ? 260 : 560;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div
          className="flex-1 flex items-center justify-center p-6 bg-white/5 overflow-auto"
          style={themeVars}
        >
          <TemplatePreview template={template} platform={platform} displayW={displayW} config={config} />
        </div>
        <div className="md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-white/10 max-h-[92vh]">
          <div className="flex items-center gap-1 p-3 border-b border-white/10">
            <div className="flex-1 min-w-0 px-1">
              <div className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300 mb-1">
                {platform === "recipe" ? "Experience Recipe" : platform === "mobile" ? "Mobile Archetype" : "Desktop Archetype"}
              </div>
              <h2 className="text-sm font-black text-white truncate">{template.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 pt-2">
            <button
              onClick={() => setTab("customize")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                tab === "customize" ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />Customize
            </button>
            <button
              onClick={() => setTab("spec")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                tab === "spec" ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />Spec
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
            {tab === "customize" ? (
              <div className="flex flex-col gap-4">
                <StudioControls config={config} onChange={onChange} />
                <StudioGenerators config={config} onChange={onChange} />
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-sm">
                <div className="text-xs text-white/40 font-mono">{template.id}</div>
                {template.layout_rule && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Layout rule</div>
                    <div className="text-white/80">{template.layout_rule}</div>
                  </div>
                )}
                {template.canonical_flow && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Canonical flow</div>
                    <div className="text-white/80">{template.canonical_flow}</div>
                  </div>
                )}
                {template.best_for?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Best for</div>
                    <div className="flex flex-wrap gap-1.5">
                      {template.best_for.map((it) => (
                        <span key={it} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/70 border border-white/10">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisualGallery() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [config, setConfig] = useState(() => loadConfig());

  useEffect(() => {
    saveConfig(config);
  }, [config]);
  useEffect(() => {
    loadFont(config.fontFamily);
  }, [config.fontFamily]);

  const themeVars = useMemo(() => themeToCssVars(config), [config]);

  const items = useMemo(() => {
    const all = GALLERY_FAMILIES.flatMap((f) =>
      f.items.map((it) => ({ ...it, _platform: familyFor(it) }))
    );
    return all.filter((it) => {
      if (tab !== "all" && it._platform !== tab) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        String(it.name).toLowerCase().includes(q) ||
        String(it.id).toLowerCase().includes(q) ||
        (it.best_for || []).some((b) => b.toLowerCase().includes(q)) ||
        (it.domain || "").toLowerCase().includes(q)
      );
    });
  }, [tab, query]);

  const counts = useMemo(() => {
    const c = { all: 0, desktop: 0, mobile: 0, recipes: 0 };
    GALLERY_FAMILIES.forEach((f) =>
      f.items.forEach((it) => {
        c.all++;
        c[familyFor(it)]++;
      })
    );
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{PREVIEW_STYLES}</style>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">Visual Template Gallery</h1>
              <p className="text-sm text-white/50">
                Live rendered previews of every template — fully rebrandable in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Studio Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <span className="text-sm">🎨</span>
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  Template Studio
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300">
                    Universal
                  </span>
                </div>
                <div className="text-[11px] text-white/40">
                  Recolor, rebrand, and recontent every template — live. Click any template for the full studio.
                </div>
              </div>
            </div>
            <button
              onClick={() => setConfig({ ...DEFAULT_CONFIG })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white"
            >
              ↻ Reset to brand
            </button>
          </div>
          <StudioControls config={config} onChange={setConfig} />
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    on
                      ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-500/30"
                      : "border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      on ? "bg-white/25" : "bg-white/10"
                    }`}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 w-56"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div style={themeVars}>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <div className="text-sm font-semibold text-white/60">No templates match</div>
              <div className="text-xs text-white/30 mt-1">Try a different tab or search term.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((it) => (
                <button
                  key={it._platform + "-" + it.id}
                  onClick={() => setSelected(it)}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden text-left group transition-all hover:border-pink-500/30 hover:bg-white/[0.07] flex flex-col"
                >
                  <div className="flex items-center justify-center bg-white/5 py-5 overflow-hidden">
                    <div className="origin-top transition-transform group-hover:scale-[1.02]">
                      <TemplatePreview template={it} platform={it._platform} displayW={232} config={config} />
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold truncate">{it.name}</h3>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/60 shrink-0">
                        {it._platform}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/40 mt-1 line-clamp-2">
                      {it.layout_rule || it.canonical_flow || (it.best_for || []).join(" · ")}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold text-pink-400">
                      View live preview
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <TemplateDetailModal
        template={selected}
        config={config}
        themeVars={themeVars}
        onChange={setConfig}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}