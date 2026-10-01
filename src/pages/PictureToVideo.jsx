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
import { Wand2, Upload, Loader2, Sparkles, Film, AlertCircle, Play, Lightbulb, X, RefreshCw } from "lucide-react";

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
  const [images, setImages] = useState([]);
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

  const allUploaded = images.length > 0 && images.every((img) => img.url && !img.uploading);
  const pictureUrls = images.filter((img) => img.url).map((img) => img.url);

  // Convert a File to a base64 data URL — sent directly to the backend function,
  // bypassing UploadPublicFile (no Base44 integration credits needed).
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);

    const newImages = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      preview: URL.createObjectURL(file),
      url: null,
      uploading: true,
      error: null,
      file,
    }));

    setImages((prev) => [...prev, ...newImages]);

    for (const img of newImages) {
      try {
        const base64 = await fileToBase64(img.file);
        setImages((prev) =>
          prev.map((p) => (p.id === img.id ? { ...p, url: base64, uploading: false } : p))
        );
      } catch (err) {
        const msg = err?.message || "Failed to process image";
        setImages((prev) =>
          prev.map((p) => (p.id === img.id ? { ...p, uploading: false, error: msg } : p))
        );
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSuggest = async () => {
    if (!allUploaded) return;
    setSuggesting(true);
    setError(null);
    setAnalysis(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("pictureToVideo", {
        picture_urls: pictureUrls,
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

  const handleGenerate = async (isRegenerate = false) => {
    if (!allUploaded) return;
    setGenerating(true);
    setError(null);
    if (!isRegenerate) setResult(null);
    try {
      const res = await base44.functions.invoke("pictureToVideo", {
        picture_urls: pictureUrls,
        user_idea: userIdea,
        category: category === "all" ? undefined : category,
        regenerate: isRegenerate,
      });
      if (res.data?.error && !res.data.analysis) throw new Error(res.data.error);
      setAnalysis(res.data.analysis);
      setResult(res.data);
      if (res.data.video_url) {
        toast({ title: isRegenerate ? "Video regenerated 🎬" : "Video generated 🎬", description: "Posted to your feed." });
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
          Upload pictures, describe your idea, and let AI combine them into a viral video using your top videos as references.
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
          <p className="text-sm text-gray-400">Upload pictures · get a viral video</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 mb-6 text-xs text-gray-400">
        <Sparkles className="w-4 h-4 text-pink-400" /> AI combines your pictures + top video patterns into one viral video.
      </div>

      {/* Step 1: Upload pictures */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="pt-5">
          <Label className="text-white mb-3 block">1. Upload picture(s)</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="picture-upload"
          />
          <label htmlFor="picture-upload" className="cursor-pointer block">
            <div className="border-2 border-dashed border-white/15 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-pink-500/40 transition-colors">
              <Upload className="w-7 h-7 text-gray-500" />
              <span className="text-sm text-gray-400">Tap to upload one or more pictures</span>
              <span className="text-xs text-gray-600">You can select multiple at once</span>
            </div>
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center p-1">
                      <span className="text-[9px] text-white text-center leading-tight line-clamp-4">{img.error}</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); removeImage(img.id); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              disabled={!allUploaded || suggesting || generating}
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
              onClick={() => handleGenerate(false)}
              disabled={!allUploaded || generating || suggesting}
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
                <p className="text-xs text-gray-500 mb-0.5">What's in your picture(s):</p>
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
              <div className="flex gap-3">
                <Button
                  onClick={() => handleGenerate(true)}
                  disabled={generating}
                  variant="outline"
                  className="rounded-full border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Regenerating…</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
                  )}
                </Button>
                <Link to="/Home">
                  <Button className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white rounded-full text-sm">
                    View in Feed
                  </Button>
                </Link>
              </div>
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