import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Rocket,
  Loader2,
  TrendingUp,
  Sparkles,
  Tag,
  Film,
  Eye,
  Play,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "entertainment", label: "Entertainment" },
  { value: "music", label: "Music" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "howto", label: "How-To" },
  { value: "travel", label: "Travel" },
  { value: "tech", label: "Tech" },
  { value: "comedy", label: "Comedy" },
  { value: "film", label: "Film" },
  { value: "sports", label: "Sports" },
  { value: "food", label: "Food" },
  { value: "art", label: "Art" },
  { value: "science", label: "Science" },
  { value: "pets", label: "Pets" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { label: "Analyzing top videos", icon: TrendingUp },
  { label: "Extracting viral formula", icon: Sparkles },
  { label: "Generating video", icon: Film },
  { label: "Publishing to feed", icon: Rocket },
];

export default function ViralVideoCreator() {
  const [category, setCategory] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Show current top videos as reference
  const { data: topVideos } = useQuery({
    queryKey: ["topVideosViral", category],
    queryFn: async () => {
      const query = category === "all" ? { visibility: "public" } : { visibility: "public", category };
      const res = await base44.entities.Video.filter(query, { sort: "-views", limit: 8 });
      return res.items || [];
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);
    setStepIndex(0);

    try {
      // Step 1-2: analyze + extract
      setStepIndex(0);
      await new Promise((r) => setTimeout(r, 600));
      setStepIndex(1);
      await new Promise((r) => setTimeout(r, 600));

      // Call the backend function (does analysis + generation + save)
      const res = await base44.functions.invoke("viralVideoCreator", {
        category: category === "all" ? undefined : category,
        count: 10,
      });

      setStepIndex(2);
      await new Promise((r) => setTimeout(r, 500));
      setStepIndex(3);
      await new Promise((r) => setTimeout(r, 500));

      const data = res.data || res;
      if (data.error && !data.analysis) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (e) {
      setError(e.message || "Generation failed — integration credits may be exhausted");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Rocket className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Viral Video Creator</h1>
          <p className="text-sm text-gray-400">AI analyzes your top videos & generates new ones using the same viral formula</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-white/5 border-white/10 p-4 mb-6">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Analyze top videos from</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 text-white rounded-xl h-12 text-base font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Generate Viral Video
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress steps */}
      {generating && (
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < stepIndex ? "bg-green-500/20" : i === stepIndex ? "bg-pink-500/20" : "bg-white/5"
                }`}>
                  {i < stepIndex ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : i === stepIndex ? (
                    <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <span className={`text-sm ${i <= stepIndex ? "text-white" : "text-gray-600"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Generation failed</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 mb-6">
          {/* Viral Formula */}
          {result.analysis?.viral_formula && (
            <Card className="bg-gradient-to-br from-pink-500/10 to-fuchsia-600/10 border-pink-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-pink-300">Viral Formula</h3>
              </div>
              <p className="text-sm text-white/90">{result.analysis.viral_formula}</p>
            </Card>
          )}

          {/* Common Themes */}
          {result.analysis?.common_themes?.length > 0 && (
            <Card className="bg-white/5 border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Common Themes</h3>
              <div className="flex flex-wrap gap-2">
                {result.analysis.common_themes.map((theme, i) => (
                  <span key={i} className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">
                    {theme}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Title Patterns + Winning Tags */}
          <div className="grid grid-cols-1 gap-4">
            {result.analysis?.title_patterns?.length > 0 && (
              <Card className="bg-white/5 border-white/10 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Title Patterns</h3>
                <ul className="space-y-1">
                  {result.analysis.title_patterns.map((p, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-pink-400 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {result.analysis?.winning_tags?.length > 0 && (
              <Card className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-pink-400" />
                  <h3 className="text-sm font-semibold text-white">Winning Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.winning_tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-pink-500/15 text-pink-300 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Generated Video Concept */}
          {result.concept && (
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-white">Generated Video Concept</h3>
              </div>
              <h4 className="text-base font-bold text-white mb-1">{result.concept.title}</h4>
              <p className="text-xs text-gray-400 mb-2">{result.concept.description}</p>
              {result.concept.script && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-0.5">Script (6s)</p>
                  <p className="text-xs text-white/80">{result.concept.script}</p>
                </div>
              )}
              {result.concept.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.concept.tags.map((t, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Generated Video */}
          {result.video_url ? (
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Generated Video</h3>
              </div>
              <div className="flex flex-col items-center gap-3">
                <video
                  src={result.video_url}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full max-w-[260px] aspect-[9/16] rounded-xl bg-black object-cover"
                />
                <Link to={createPageUrl("Home")}>
                  <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white rounded-full text-sm">
                    <Eye className="w-4 h-4 mr-1.5" /> View in Feed
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            result.concept && (
              <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-300 font-medium">Analysis complete — video generation skipped</p>
                    <p className="text-xs text-yellow-400/70 mt-1">
                      The viral formula and concept were generated successfully, but the video couldn't be rendered (integration credits may be exhausted). The concept above is ready to use.
                    </p>
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {/* Top Videos Reference */}
      {!generating && !result && topVideos && topVideos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Current Top Videos</h3>
          </div>
          <div className="space-y-2">
            {topVideos.slice(0, 5).map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
                <span className="text-xs font-bold text-pink-400 w-5 text-center">{i + 1}</span>
                <div className="w-16 h-10 rounded bg-white/10 flex-shrink-0 overflow-hidden">
                  {v.thumbnail_url && (
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{v.title}</p>
                  <p className="text-[10px] text-gray-500">{v.channel_name} • {v.views?.toLocaleString()} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}