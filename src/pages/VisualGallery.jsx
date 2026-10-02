import React, { useState, useMemo, useEffect } from "react";
import { LayoutTemplate, Search, SlidersHorizontal, X, FileText, Play, Sparkles, Wand2, Zap, Clock } from "lucide-react";
import { PREVIEW_STYLES } from "@/lib/gallery/previewStyles.js";
import { loadConfig, saveConfig, themeToCssVars, DEFAULT_CONFIG, loadFont } from "@/lib/gallery/studioConfig.js";
import { VIRAL_TEMPLATES, VIRAL_CATEGORIES, renderViralPreview, viralCategoryFor } from "@/lib/gallery/viralPreviewRenderer.js";
import StudioControls from "@/components/gallery/StudioControls.jsx";
import StudioGenerators from "@/components/gallery/StudioGenerators.jsx";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  advanced: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

function ViralPreview({ template, displayW = 232, config }) {
  const { frame, designW, designH, html } = renderViralPreview(template, config);
  const scale = displayW / designW;
  return (
    <div style={{ width: designW, height: designH, transform: `scale(${scale})`, transformOrigin: "top center" }} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function TemplateDetailModal({ template, config, themeVars, onChange, onClose }) {
  const [tab, setTab] = useState("customize");
  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Preview side */}
        <div className="flex-1 flex items-center justify-center p-6 bg-black/30 overflow-auto" style={themeVars}>
          <div className="shrink-0">
            <ViralPreview template={template} displayW={280} config={config} />
          </div>
        </div>

        {/* Details side */}
        <div className="md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-l border-white/10 max-h-[92vh]">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300">
                {template.category}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${DIFFICULTY_STYLES[template.difficulty]}`}>
                {template.difficulty}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white/60">
                <Clock className="w-2.5 h-2.5" />{template.avg_duration}s
              </span>
            </div>
            <h2 className="text-lg font-black text-white">{template.name}</h2>
            <p className="text-xs text-white/50 mt-1">{template.tagline}</p>
          </div>

          <div className="flex items-center gap-1 px-3 pt-3">
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

          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {tab === "customize" ? (
              <div className="flex flex-col gap-4">
                <StudioControls config={config} onChange={onChange} />
                <StudioGenerators config={config} onChange={onChange} />
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-sm">
                <p className="text-white/80 leading-relaxed">{template.description}</p>

                {template.hook_pattern && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Hook</div>
                    <div className="text-white/80 text-xs">{template.hook_pattern}</div>
                  </div>
                )}
                {template.pacing && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Pacing</div>
                    <div className="text-white/80 text-xs">{template.pacing}</div>
                  </div>
                )}
                {template.music_style && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Music</div>
                    <div className="text-white/80 text-xs">{template.music_style}</div>
                  </div>
                )}
                {template.shot_list?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Shot sequence</div>
                    <ol className="space-y-1">
                      {template.shot_list.map((shot, i) => (
                        <li key={i} className="flex gap-2 text-xs text-white/80">
                          <span className="font-bold text-pink-400">{i + 1}.</span>
                          <span>{shot}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {template.visual_effects?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Visual effects</div>
                    <div className="flex flex-wrap gap-1.5">
                      {template.visual_effects.map((fx) => (
                        <span key={fx} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/70 border border-white/10">
                          {fx}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {template.color_palette?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Color palette</div>
                    <div className="flex gap-1.5">
                      {template.color_palette.map((c) => (
                        <div key={c} className="w-7 h-7 rounded-lg border border-white/10" style={{ background: c }} title={c} />
                      ))}
                    </div>
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
  const [activeCategory, setActiveCategory] = useState("All");
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

  const filtered = useMemo(() => {
    return VIRAL_TEMPLATES.filter((t) => {
      if (activeCategory !== "All" && viralCategoryFor(t) !== activeCategory) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.best_for || []).some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, query]);

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
              <h1 className="text-xl font-black">Viral Template Gallery</h1>
              <p className="text-sm text-white/50">
                20 ultra high-quality video templates inspired by top viral trends.
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
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <div className="text-sm font-bold">Template Studio</div>
                <div className="text-[11px] text-white/40">Recolor and rebrand every template — live.</div>
              </div>
            </div>
            <button
              onClick={() => setConfig({ ...DEFAULT_CONFIG })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white"
            >
              ↻ Reset
            </button>
          </div>
          <StudioControls config={config} onChange={setConfig} />
        </div>

        {/* Category pills + search */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {VIRAL_CATEGORIES.map((cat) => {
              const on = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    on
                      ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-500/30"
                      : "border border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat}
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
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 w-48"
            />
          </div>
        </div>

        {/* Template count */}
        <div className="mb-4 text-xs text-white/40">
          {filtered.length} of {VIRAL_TEMPLATES.length} templates
        </div>

        {/* Gallery Grid — 9:16 vertical previews */}
        <div style={themeVars}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-pink-500/40 hover:bg-white/[0.07]"
              >
                {/* 9:16 Preview */}
                <div className="aspect-[9/16] overflow-hidden bg-black flex items-center justify-center">
                  <div className="origin-top transition-transform duration-300 group-hover:scale-[1.03]">
                    <ViralPreview template={t} displayW={170} config={config} />
                  </div>
                </div>

                {/* Info overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <h3 className="text-sm font-bold text-white truncate">{t.name}</h3>
                  <p className="text-[10px] text-white/50 truncate mt-0.5">{t.tagline}</p>
                </div>

                {/* One-tap badge */}
                <div className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                  <Zap className="w-2.5 h-2.5 text-pink-400" />
                  <span className="text-[8px] font-bold text-white">1 TAP</span>
                </div>

                {/* Difficulty badge */}
                <span className={`absolute top-2 right-2 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase backdrop-blur-sm ${DIFFICULTY_STYLES[t.difficulty]}`}>
                  {t.difficulty}
                </span>

                {/* Hover play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/90 shadow-lg">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                </div>
              </button>
            ))}
          </div>
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