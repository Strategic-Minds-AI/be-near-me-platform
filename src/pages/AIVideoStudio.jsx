import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Check, AlertCircle, Clapperboard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PRESETS = [
  { id: "neon_city", title: "Neon Cyberpunk City", emoji: "🌃", gradient: "from-fuchsia-600 to-pink-500" },
  { id: "ocean_sunset", title: "Ocean Sunset", emoji: "🌅", gradient: "from-amber-500 to-pink-500" },
  { id: "cosmic_nebula", title: "Cosmic Nebula", emoji: "🌌", gradient: "from-purple-600 to-fuchsia-500" },
  { id: "tokyo_night", title: "Tokyo Street Night", emoji: "🗼", gradient: "from-pink-500 to-rose-500" },
  { id: "mountain_aurora", title: "Mountain Aurora", emoji: "🏔️", gradient: "from-cyan-500 to-emerald-500" },
  { id: "desert_dunes", title: "Desert Dunes", emoji: "🏜️", gradient: "from-amber-400 to-orange-500" },
  { id: "underwater_coral", title: "Underwater Coral", emoji: "🐠", gradient: "from-cyan-400 to-blue-500" },
  { id: "volcanic_eruption", title: "Volcanic Eruption", emoji: "🌋", gradient: "from-red-500 to-orange-600" },
  { id: "cherry_blossom", title: "Cherry Blossom", emoji: "🌸", gradient: "from-pink-400 to-rose-400" },
  { id: "drone_race", title: "Futuristic Drone Race", emoji: "🚁", gradient: "from-slate-400 to-fuchsia-500" },
];

export default function AIVideoStudio() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const generate = async (presetId) => {
    setGenerating(presetId);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("aiVideoGen", { presetId });
      if (res.data?.error) throw new Error(res.data.error);
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ["myVideos"] });
      toast({ title: "Video generated ✓", description: "Posted to your feed." });
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Clapperboard className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">AI Video Studio</h1>
        <p className="text-gray-400 max-w-md">
          Sign in to generate cinematic vertical videos with a single tap.
        </p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
        >
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Clapperboard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Video Studio</h1>
          <p className="text-sm text-gray-400">10 one-tap cinematic vertical videos · single touch</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 mb-6 text-xs text-gray-400">
        <Sparkles className="w-4 h-4 text-pink-400" /> Each tap generates a 6-second 9:16 clip and posts it to your feed.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {PRESETS.map((p) => {
          const busy = generating === p.id;
          return (
            <button
              key={p.id}
              onClick={() => generate(p.id)}
              disabled={!!generating}
              className={`group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 disabled:opacity-60 transition transform hover:scale-[1.02]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                <span className="text-4xl mb-2">{p.emoji}</span>
                <span className="text-white font-semibold text-sm leading-tight drop-shadow">
                  {p.title}
                </span>
              </div>
              {busy && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="text-white text-xs">Generating…</span>
                </div>
              )}
              {!busy && !generating && (
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Generation failed</p>
            <p className="text-sm">{error}</p>
            {/credit|limit|quota|exhaust/i.test(error) && (
              <p className="text-xs mt-2 text-red-300/80">
                Integration credits refresh on Oct 12, 2026 — generation will work again then.
              </p>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Generated & posted to your feed</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <video
              src={result.url}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-40 h-72 object-cover rounded-xl bg-black"
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">{result.title}</h3>
              <p className="text-gray-400 text-sm mt-1">
                This video is now public in the feed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}