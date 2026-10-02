import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmPage, BnmHeader } from "@/components/bnm/BnmChrome";
import VisualDnaBadge from "@/components/bnm/VisualDnaBadge";
import ImageUploader from "@/components/bnm/ImageUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Wand2,
  X,
  CheckCircle2,
  Film,
  Play,
  Radar,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  advanced: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

const DURATIONS = [
  { value: 4, label: "4s", desc: "Snappy" },
  { value: 6, label: "6s", desc: "Standard" },
  { value: 8, label: "8s", desc: "Extended" },
];

export default function BnmCreate() {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [idea, setIdea] = useState("");
  const [images, setImages] = useState([]);
  const [duration, setDuration] = useState(6);
  const [result, setResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [scanOpen, setScanOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["viralTemplates"],
    queryFn: async () => {
      const res = await base44.entities.ViralTemplate.filter(
        {},
        { sort: "style_name", limit: 50 }
      );
      return res?.items || [];
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(templates?.map((t) => t.category) || []);
    return ["All", ...Array.from(cats).sort()];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "All") return templates || [];
    return (templates || []).filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  const generateMutation = useMutation({
    mutationFn: async ({ template_id, user_idea, user_images, dur }) => {
      const res = await base44.functions.invoke("generateFromTemplate", {
        template_id,
        user_idea,
        user_images,
        duration: dur,
      });
      return res.data;
    },
    onSuccess: (data) => setResult(data),
  });

  const handleGenerate = () => {
    if (!activeTemplate) return;
    setResult(null);
    generateMutation.mutate({
      template_id: activeTemplate.id,
      user_idea: idea.trim(),
      user_images: images,
      dur: duration,
    });
  };

  const openTemplate = (t) => {
    setActiveTemplate(t);
    setResult(null);
    setIdea("");
    setImages([]);
    setDuration(t.avg_duration || 6);
  };

  return (
    <BnmPage>
      <BnmHeader title="Create" brand />

      {/* Hero */}
      <div className="px-5 pt-3 pb-4">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/15 via-[#0a0a14] to-cyan-500/10 p-5">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-fuchsia-400" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Make a viral video in seconds
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[#9ba6bb]">
            We skip-traced the top creators and cloned their exact styles —
            colors, fonts, effects, transitions, everything. Pick a style, drop
            your photos, choose the length, and get a viral-ready video.
          </p>
          <button
            onClick={() => setScanOpen(true)}
            className="mt-3 flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <Radar className="h-3.5 w-3.5" /> Scan trending videos now
          </button>
        </div>
      </div>

      {/* Category pills */}
      {!isLoading && templates?.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                  activeCategory === cat
                    ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300"
                    : "border-white/10 bg-white/[0.03] text-[#8f9ab0] hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template grid */}
      <div className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#8f9ab0]">
            {isLoading ? "Loading styles…" : `${filteredTemplates.length} viral styles`}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => openTemplate(t)}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left transition hover:border-fuchsia-500/40 hover:bg-white/[0.07]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/25 to-cyan-500/20">
                    <Film className="h-4 w-4 text-fuchsia-300" />
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                      DIFFICULTY_STYLES[t.difficulty] || DIFFICULTY_STYLES.beginner
                    }`}
                  >
                    {t.difficulty}
                  </span>
                </div>
                {/* Color strip */}
                {t.color_palette?.length > 0 && (
                  <div className="mb-2 flex gap-0.5 rounded-md overflow-hidden h-1.5">
                    {t.color_palette.slice(0, 6).map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
                <p className="text-[13px] font-bold leading-tight text-white line-clamp-2">
                  {t.style_name}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[#8f9ab0] line-clamp-2">
                  {t.tagline}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-fuchsia-400 opacity-0 transition group-hover:opacity-100">
                  <Wand2 className="h-3 w-3" /> Use this style
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && (!templates || templates.length === 0) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-[#8f9ab0]">
              No viral templates yet. An admin needs to run the skip-trace first
              to discover the top 10 styles.
            </p>
          </div>
        )}
      </div>

      {/* Skip-trace scanner sheet */}
      {scanOpen && (
        <ScanSheet onClose={() => setScanOpen(false)} />
      )}

      {/* Generator sheet */}
      {activeTemplate && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveTemplate(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <button
              onClick={() => setActiveTemplate(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Style header */}
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">
                {activeTemplate.category} · {activeTemplate.difficulty}
              </span>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white">
                {activeTemplate.style_name}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-[#9ba6bb]">
                {activeTemplate.description}
              </p>
            </div>

            {/* Visual DNA */}
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">
                Visual DNA — what top creators use
              </p>
              <VisualDnaBadge template={activeTemplate} />
            </div>

            {/* Style formula */}
            <div className="mb-4 space-y-2.5">
              <StyleRow label="Hook" value={activeTemplate.hook_pattern} />
              <StyleRow label="Pacing" value={activeTemplate.pacing} />
              <StyleRow label="Music" value={activeTemplate.music_style} />
              <StyleRow label="Caption" value={activeTemplate.caption_formula} />
              {activeTemplate.shot_list?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
                    Shot sequence
                  </p>
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

            {/* Image upload */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8f9ab0]">
                <ImageIcon className="h-3.5 w-3.5" /> Your images (optional)
              </label>
              <ImageUploader images={images} onChange={setImages} max={6} />
            </div>

            {/* Duration selector */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8f9ab0]">
                <Clock className="h-3.5 w-3.5" /> Video length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`rounded-xl border py-2.5 text-center transition ${
                      duration === d.value
                        ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                    }`}
                  >
                    <p className="text-base font-extrabold">{d.label}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
                      {d.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Idea input */}
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8f9ab0]">
              Your idea (optional)
            </label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. a sunrise hike, making latte art, my dog's first beach day…"
              className="mb-4 min-h-[80px] resize-none bg-white/5 text-white"
            />

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 py-6 text-base font-bold text-white hover:opacity-90"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating your video…
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" /> Generate {duration}s video
                </>
              )}
            </Button>

            {generateMutation.isPending && (
              <p className="mt-3 text-center text-xs text-[#788399]">
                Analyzing your images, applying the style's visual DNA, and rendering
                a {duration}s vertical video — this takes ~30-60 seconds.
              </p>
            )}

            {generateMutation.isError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {generateMutation.error?.message || "Generation failed. Try again."}
              </div>
            )}

            {result?.video_url && (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-bold">Your video is live on the feed!</p>
                </div>
                <video
                  src={result.video_url}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="mx-auto max-h-[55vh] w-full rounded-xl"
                />
                <p className="mt-2 text-center text-sm font-semibold text-white">
                  {result.analysis?.title}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to="/home"
                    className="flex-1 rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white hover:bg-white/15"
                  >
                    <Play className="mr-1.5 inline h-4 w-4" /> View on feed
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
                Concept ready, but video rendering failed: {result.error}. Try again.
              </div>
            )}
          </div>
        </div>
      )}
    </BnmPage>
  );
}

// ── Skip-trace scanner sheet ──
function ScanSheet({ onClose }) {
  const [scanResult, setScanResult] = useState(null);
  const [customQuery, setCustomQuery] = useState("");

  const scanMutation = useMutation({
    mutationFn: async (query) => {
      const res = await base44.functions.invoke("scanTopVideos", { query: query || undefined });
      return res.data;
    },
    onSuccess: (data) => setScanResult(data),
  });

  const handleScan = () => {
    setScanResult(null);
    scanMutation.mutate(customQuery.trim());
  };

  const categoryColors = {
    gaming: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    music: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    vlogs: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    howto: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    comedy: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    food: "bg-red-500/15 text-red-300 border-red-500/30",
    travel: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    fashion: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    sports: "bg-lime-500/15 text-lime-300 border-lime-500/30",
    tech: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    art: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    pets: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    entertainment: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Radar className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-extrabold tracking-tight text-white">
            Viral Skip-Trace Scanner
          </h3>
        </div>
        <p className="mb-4 text-sm leading-6 text-[#9ba6bb]">
          Scan what's trending right now across YouTube. See the top videos,
          creators, and categories in real time.
        </p>

        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="Custom search (optional) — e.g. 'viral cooking shorts'"
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-[#788399]"
        />

        <Button
          onClick={handleScan}
          disabled={scanMutation.isPending}
          className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 py-5 text-sm font-bold text-white hover:opacity-90"
        >
          {scanMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning trends…
            </>
          ) : (
            <>
              <Radar className="mr-2 h-4 w-4" /> Scan top videos
            </>
          )}
        </Button>

        {scanResult?.videos && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8f9ab0]">
              {scanResult.total} trending videos found
            </p>
            <div className="space-y-2">
              {scanResult.videos.map((v, i) => (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-cyan-500/30 hover:bg-white/[0.06]"
                >
                  <img
                    src={v.thumbnail}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-white">
                      {v.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#788399]">{v.channel}</p>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                        categoryColors[v.category] || categoryColors.entertainment
                      }`}
                    >
                      {v.category}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {scanMutation.isError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {scanMutation.error?.message || "Scan failed. Try again."}
          </div>
        )}
      </div>
    </div>
  );
}

function StyleRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#788399] pt-0.5">
        {label}
      </span>
      <span className="flex-1 text-xs leading-5 text-white/85">{value}</span>
    </div>
  );
}