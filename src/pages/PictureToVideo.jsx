import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Wand2, Upload, Loader2, Sparkles, Film, AlertCircle, Play, ImagePlus, Lightbulb } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "entertainment", label: "Entertainment" },
  { value: "music", label: "Music" },
  { value: "gaming", label: "Gaming" },
  { value: "comedy", label: "Comedy" },
  { value: "howto", label: "How-To" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "art", label: "Art" },
  { value: "pets", label: "Pets" },
  { value: "other", label: "Other" },
];

export default function PictureToVideo() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [pictureUrl, setPictureUrl] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userIdea, setUserIdea] = useState("");
  const [category, setCategory] = useState("all");
  const [suggesting, setSuggesting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setPicturePreview(URL.createObjectURL(file));
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setPictureUrl(res.file_url);
      toast({ title: "Picture uploaded ✓" });
    } catch (err) {
      setError("Could not upload picture. Please try again.");
      setPicturePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSuggest = async () => {
    if (!pictureUrl) return;
    setSuggesting(true);
    setError(null);
    setAnalysis(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("pictureToVideo", {
        picture_url: pictureUrl,
        user_idea: userIdea,
        category: category === "all" ? undefined : category,
        suggest_prompt: true,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
      toast({ title: "Viral prompt ready ✨", description: "Check the suggested prompt below." });
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      toast({ title: "Could not generate prompt", variant: "destructive" });
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!pictureUrl) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("pictureToVideo", {
        picture_url: pictureUrl,
        user_idea: userIdea,
        category: category === "all" ? undefined : category,
      });
      if (res.data?.error && !res.data.analysis) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
      setResult(res.data);
      if (res.data.video_url) {
        toast({ title: "Video generated 🎬", description: "Posted to your feed." });
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setError(msg);
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Picture to Video</h1>
        <p className="text-gray-400 max-w-md">
          Upload a picture, describe your idea, and let AI generate a viral video using your top videos as references.
        </p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white">
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Picture to Video</h1>
          <p className="text-sm text-gray-400">Upload a picture · get a viral video</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 mb-6 text-xs text-gray-400">
        <Sparkles className="w-4 h-4 text-pink-400" /> AI analyzes your picture + top videos to craft the perfect viral prompt.
      </div>

      {/* Step 1: Upload picture */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="pt-5">
          <Label className="text-white mb-3 block">1. Upload a picture</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePictureUpload}
            className="hidden"
            id="picture-upload"
          />
          <label htmlFor="picture-upload" className="cursor-pointer block">
            {picturePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={picturePreview} alt="Upload preview" className="w-full max-h-64 object-cover" />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-white bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-medium pointer-events-none">
                  <ImagePlus className="w-3.5 h-3.5" /> Change
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/15 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-pink-500/40 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-400">Tap to upload a picture</span>
                  </>
                )}
              </div>
            )}
          </label>
        </CardContent>
      </Card>

      {/* Step 2: Idea + category */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="pt-5 space-y-4">
          <div>
            <Label className="text-white mb-2 block">2. What kind of video? (optional)</Label>
            <Input
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder="e.g. 'a wholesome act of kindness in a city' — or leave blank and let AI suggest"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSuggest}
              disabled={!pictureUrl || suggesting || generating}
              variant="outline"
              className="rounded-full border-pink-500/40 text-pink-300 hover:bg-pink-500/10 flex-1"
            >
              {suggesting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
              ) : (
                <><Lightbulb className="w-4 h-4 mr-2" /> Suggest viral prompt</>
              )}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!pictureUrl || generating || suggesting}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 rounded-full flex-1"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Film className="w-4 h-4 mr-2" /> Generate video</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30 mb-4">
          <CardContent className="pt-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Something went wrong</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              {/credit|limit|quota|exhaust/i.test(error) && (
                <p className="text-xs mt-2 text-red-300/80">Integration credits refresh on Oct 12, 2026 — generation will work again then.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis / suggested prompt */}
      {analysis && (
        <Card className="bg-gradient-to-br from-pink-500/10 to-fuchsia-600/10 border-pink-500/20 mb-4">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-pink-300">AI Analysis</h3>
            </div>
            {analysis.picture_analysis && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">What's in your picture:</p>
                <p className="text-sm text-white/90">{analysis.picture_analysis}</p>
              </div>
            )}
            {analysis.suggested_idea && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Suggested idea:</p>
                <p className="text-sm text-white/90">{analysis.suggested_idea}</p>
              </div>
            )}
            {analysis.viral_prompt && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">What to type to get a viral video:</p>
                <p className="text-sm text-white font-medium bg-white/5 rounded-lg p-3 border border-white/10">{analysis.viral_prompt}</p>
              </div>
            )}
            {analysis.video_title && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Recommended title:</p>
                <p className="text-sm text-white/90">{analysis.video_title}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result?.video_url && (
        <Card className="bg-white/5 border-white/10 mb-4">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Your viral video</h3>
            </div>
            <div className="flex flex-col items-center gap-3">
              <video src={result.video_url} controls autoPlay loop muted playsInline className="w-full max-w-[260px] aspect-[9/16] rounded-xl bg-black object-cover" />
              <Link to="/Home">
                <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white rounded-full text-sm">
                  View in Feed
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !result.video_url && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 mb-4">
          <CardContent className="pt-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Prompt ready — video couldn't be rendered</p>
              <p className="text-xs text-yellow-400/70 mt-1">The viral prompt above is ready to use. Video generation may be unavailable due to credit limits.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}