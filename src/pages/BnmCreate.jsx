import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmPage, BnmHeader } from "@/components/bnm/BnmChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, X, CheckCircle2, Film, Play } from "lucide-react";
import { Link } from "react-router-dom";

const DIFFICULTY_STYLES = {
  beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  advanced: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
};

export default function BnmCreate() {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState(null);

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

  const generateMutation = useMutation({
    mutationFn: async ({ template_id, user_idea }) => {
      const res = await base44.functions.invoke("generateFromTemplate", {
        template_id,
        user_idea,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleGenerate = () => {
    if (!activeTemplate) return;
    setResult(null);
    generateMutation.mutate({
      template_id: activeTemplate.id,
      user_idea: idea.trim(),
    });
  };

  const openTemplate = (t) => {
    setActiveTemplate(t);
    setResult(null);
    setIdea("");
  };

  return (
    <BnmPage>
      <BnmHeader title="Create" brand />

      {/* Hero */}
      <div className="px-5 pt-3 pb-5">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/15 via-[#0a0a14] to-cyan-500/10 p-5">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-fuchsia-400" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Make a viral video in seconds
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[#9ba6bb]">
            We skip-traced the top creators across social media and cloned their
            winning styles into 10 templates. Pick one, drop your idea, and our
            generator makes the video for you.
          </p>
        </div>
      </div>

      {/* Template grid */}
      <div className="px-5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#8f9ab0]">
            {isLoading ? "Loading styles…" : `${templates?.length || 0} viral styles`}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates?.map((t) => (
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

      {/* Generator sheet */}
      {activeTemplate && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveTemplate(null)}
          />
          <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0c14] p-5 pb-8 no-scrollbar">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <button
              onClick={() => setActiveTemplate(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Style breakdown */}
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
              {activeTemplate.example_creators?.length > 0 && (
                <p className="text-[11px] text-[#788399]">
                  Popularized by: {activeTemplate.example_creators.join(", ")}
                </p>
              )}
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
                  <Wand2 className="mr-2 h-5 w-5" /> Generate with this style
                </>
              )}
            </Button>

            {generateMutation.isPending && (
              <p className="mt-3 text-center text-xs text-[#788399]">
                Analyzing the style, writing the script, and rendering a vertical
                video — this takes ~30-60 seconds.
              </p>
            )}

            {/* Error */}
            {generateMutation.isError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {generateMutation.error?.message || "Generation failed. Try again."}
              </div>
            )}

            {/* Result */}
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
                <Link
                  to="/home"
                  className="mt-3 block rounded-full bg-white/10 py-3 text-center text-sm font-bold text-white hover:bg-white/15"
                >
                  <Play className="mr-1.5 inline h-4 w-4" /> View on the feed
                </Link>
              </div>
            )}

            {result?.error && !result?.video_url && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                Concept ready, but video rendering failed: {result.error}. Your idea
                was good — try generating again.
              </div>
            )}
          </div>
        </div>
      )}
    </BnmPage>
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