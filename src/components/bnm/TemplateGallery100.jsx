import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { VIRAL_TEMPLATES_100, VIRAL_CATEGORIES_100 } from "@/lib/gallery/viralTemplates100.js";
import {
  BnmSparkleIcon, BnmFilmIcon, BnmBoltIcon, BnmSlidersIcon,
  BnmCloseIcon, BnmPlayIcon, BnmSpinnerIcon, BnmCheckCircleIcon,
  BnmAlertIcon, BnmWandIcon
} from "@/components/bnm/BnmIcons";
import { base44 } from "@/api/base44Client";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  advanced: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

export default function TemplateGallery100() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState(6);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState(null);
  const [quickResult, setQuickResult] = useState(null);

  const filtered = useMemo(() => {
    let list = VIRAL_TEMPLATES_100;
    if (activeCategory !== "All") {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    VIRAL_TEMPLATES_100.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  const quickGenerate = async (template) => {
    if (!template?.id) return;
    setQuickLoadingId(template.id);
    setQuickResult(null);
    try {
      const res = await base44.functions.invoke("generateFromTemplate", {
        template_id: template.id,
        user_idea: "",
        user_images: [],
        duration: template.avg_duration || 6,
      });
      const data = res.data;
      if (!data?.video_url) {
        throw new Error(data?.error || "Template did not produce a video. Credits may be exhausted.");
      }
      setQuickResult({ template_id: template.id, data });
    } catch (e) {
      setQuickResult({
        template_id: template.id,
        data: { error: e.message || "Generation failed" },
      });
    } finally {
      setQuickLoadingId(null);
    }
  };

  const openCustomize = (t) => {
    setActiveTemplate(t);
    setResult(null);
    setIdea("");
    setDuration(t.avg_duration || 6);
  };

  const handleGenerate = async () => {
    if (!activeTemplate) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("generateFromTemplate", {
        template_id: activeTemplate.id,
        user_idea: idea.trim(),
        user_images: [],
        duration,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message || "Generation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="px-3 pt-2 pb-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-600/15 via-[#0a0a14] to-cyan-500/10 p-3">
          <div className="flex items-center gap-2 text-white">
            <BnmSparkleIcon size={16} />
            <h2 className="text-sm font-extrabold tracking-tight">100 Viral Templates</h2>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-[#9ba6bb]">
            10 templates across the top 10 viral categories. Tap any template — we generate a viral video instantly.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search 100 templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white placeholder:text-[#6b7591] outline-none focus:border-fuchsia-500/40"
        />
      </div>

      {/* Category pills */}
      <div className="px-3 pb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {VIRAL_CATEGORIES_100.map((cat) => {
            const count = cat === "All" ? VIRAL_TEMPLATES_100.length : categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                  activeCategory === cat
                    ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300"
                    : "border-white/10 bg-white/[0.03] text-[#8f9ab0] hover:border-white/20"
                }`}
              >
                {cat} {count > 0 && <span className="opacity-50">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template grid */}
      <div className="px-3 pb-4">
        <div className="mb-2 flex items-center gap-1.5">
          <BnmFilmIcon size={14} />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
            {filtered.length} templates
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((t) => {
            const busy = quickLoadingId === t.id;
            const hasResult = quickResult?.template_id === t.id && quickResult.data;
            const showVideo = hasResult && quickResult.data.video_url;
            const showError = hasResult && quickResult.data.error && !quickResult.data.video_url;
            return (
              <div
                key={t.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-fuchsia-500/40"
              >
                <button
                  onClick={() => quickGenerate(t)}
                  disabled={busy}
                  className="relative block aspect-[9/16] w-full overflow-hidden"
                >
                  {/* CSS gradient preview */}
                  <div
                    className="absolute inset-0 transition group-hover:scale-105"
                    style={{ background: t.preview?.gradient || "linear-gradient(135deg, #1a1a2e, #e94560)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Category badge */}
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[7px] font-bold text-white backdrop-blur-sm">
                    {t.category}
                  </span>

                  {/* Difficulty badge */}
                  <span
                    className={`absolute right-1.5 top-1.5 rounded-full border px-1 py-0.5 text-[7px] font-bold uppercase backdrop-blur-sm ${
                      DIFFICULTY_STYLES[t.difficulty] || DIFFICULTY_STYLES.beginner
                    }`}
                  >
                    {t.difficulty}
                  </span>

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl opacity-90 drop-shadow-lg">{t.preview?.icon || "🎬"}</span>
                  </div>

                  {/* Hook text */}
                  {t.preview?.hookText && (
                    <div
                      className={`absolute inset-x-0 ${
                        t.preview.textPos === "top"
                          ? "top-2"
                          : t.preview.textPos === "bottom"
                          ? "bottom-8"
                          : "top-1/2 -translate-y-1/2"
                      } px-2 text-center`}
                    >
                      <span className="text-[10px] font-extrabold text-white drop-shadow-lg">{t.preview.hookText}</span>
                    </div>
                  )}

                  {/* 1-tap badge */}
                  {!busy && (
                    <div className="absolute left-1.5 bottom-7 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                      <BnmBoltIcon size={10} />
                      <span className="text-[7px] font-bold text-white">1 TAP</span>
                    </div>
                  )}

                  {/* Name + tagline */}
                  <div className="absolute inset-x-0 bottom-0 p-1.5">
                    <p className="text-[10px] font-extrabold leading-tight text-white drop-shadow-lg line-clamp-1">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-[8px] leading-2.5 text-white/60 line-clamp-1">{t.tagline}</p>
                  </div>

                  {/* Loading overlay */}
                  {busy && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 backdrop-blur-sm">
                      <BnmSpinnerIcon size={20} />
                      <span className="text-[8px] font-bold text-white">Generating...</span>
                    </div>
                  )}

                  {/* Success */}
                  {showVideo && !busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90">
                        <BnmPlayIcon size={16} />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {showError && !busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/40">
                      <BnmAlertIcon size={20} />
                    </div>
                  )}
                </button>

                {/* Customize button */}
                <button
                  onClick={() => openCustomize(t)}
                  className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20"
                  title="Customize"
                >
                  <BnmSlidersIcon size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick result sheet */}
      {quickResult?.data?.video_url && !quickLoadingId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuickResult(null)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <button
              onClick={() => setQuickResult(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            >
              <BnmCloseIcon size={16} />
            </button>
            <div className="mb-4 flex items-center gap-2 text-emerald-300">
              <BnmCheckCircleIcon size={20} />
              <p className="font-bold">Your video is live!</p>
            </div>
            <video
              src={quickResult.data.video_url}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="mx-auto max-h-[55vh] w-full max-w-[260px] rounded-xl"
            />
            <div className="mt-3 flex gap-2">
              <Link
                to="/home"
                className="flex-1 rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white hover:bg-white/15"
              >
                <BnmPlayIcon size={16} /> View on feed
              </Link>
              <Link
                to="/tracker"
                className="flex-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 py-3 text-center text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-500/20"
              >
                Track performance
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick error sheet */}
      {quickResult?.data?.error && !quickLoadingId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuickResult(null)} />
          <div className="relative max-h-[50vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <button
              onClick={() => setQuickResult(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            >
              <BnmCloseIcon size={16} />
            </button>
            <div className="mb-3 flex items-center gap-2 text-red-300">
              <BnmAlertIcon size={20} />
              <p className="font-bold">Generation failed</p>
            </div>
            <p className="text-sm text-red-300/80">{quickResult.data.error}</p>
            <button
              onClick={() => setQuickResult(null)}
              className="mt-4 w-full rounded-full bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Customize sheet */}
      {activeTemplate && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActiveTemplate(null)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <button
              onClick={() => setActiveTemplate(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            >
              <BnmCloseIcon size={16} />
            </button>

            {/* Header */}
            <div className="mb-4 flex gap-3">
              <div
                className="h-20 w-[45px] shrink-0 overflow-hidden rounded-xl"
                style={{ background: activeTemplate.preview?.gradient }}
              >
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {activeTemplate.preview?.icon || "🎬"}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">
                  {activeTemplate.category} · {activeTemplate.difficulty}
                </span>
                <h3 className="mt-1 text-base font-extrabold leading-tight tracking-tight text-white">
                  {activeTemplate.name}
                </h3>
                <p className="mt-0.5 text-xs leading-4 text-[#9ba6bb] line-clamp-2">{activeTemplate.tagline}</p>
              </div>
            </div>

            <p className="mb-4 text-xs leading-5 text-[#9ba6bb]">{activeTemplate.description}</p>

            {/* Style formula */}
            <div className="mb-4 space-y-2">
              <StyleRow label="Hook" value={activeTemplate.hook_pattern} />
              <StyleRow label="Pacing" value={activeTemplate.pacing} />
              <StyleRow label="Music" value={activeTemplate.music_style} />
              <StyleRow label="Caption" value={activeTemplate.caption_formula} />
              {activeTemplate.shot_list?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">Shot sequence</p>
                  <ol className="space-y-1">
                    {activeTemplate.shot_list.map((shot, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/80">
                        <span className="font-bold text-fuchsia-400">{i + 1}.</span>
                        <span>{shot}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Duration selector */}
            <div className="mb-4">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
                Video length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-xl border py-2.5 text-center transition ${
                      duration === d
                        ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <p className="text-sm font-extrabold">{d}s</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Idea input */}
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
              Your idea (optional)
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. a sunrise hike, making latte art, my dog's first beach day..."
              className="mb-4 min-h-[70px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none placeholder:text-[#6b7591] focus:border-fuchsia-500/40"
            />

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 py-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <BnmSpinnerIcon size={16} /> Generating your video...
                </>
              ) : (
                <>
                  <BnmWandIcon size={16} /> Generate {duration}s video
                </>
              )}
            </button>

            {result?.video_url && (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-300">
                  <BnmCheckCircleIcon size={20} />
                  <p className="font-bold">Your video is live!</p>
                </div>
                <video
                  src={result.video_url}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="mx-auto max-h-[55vh] w-full max-w-[260px] rounded-xl"
                />
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/home"
                    className="flex-1 rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white hover:bg-white/15"
                  >
                    <BnmPlayIcon size={16} /> View on feed
                  </Link>
                  <Link
                    to="/tracker"
                    className="flex-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 py-3 text-center text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-500/20"
                  >
                    Track performance
                  </Link>
                </div>
              </div>
            )}

            {result?.error && !result?.video_url && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                {result.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StyleRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="w-14 shrink-0 pt-0.5 text-[9px] font-bold uppercase tracking-wider text-[#788399]">{label}</span>
      <span className="flex-1 text-[11px] leading-4 text-white/85">{value}</span>
    </div>
  );
}