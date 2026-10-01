import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import MediaKitTool from "@/components/mediakit/MediaKitTool";
import MediaKitResult from "@/components/mediakit/MediaKitResult";
import FreeLimitPopup from "@/components/mediakit/FreeLimitPopup";
import { Sparkles, TrendingUp } from "lucide-react";

const FREE_LIMIT_KEY = "benearme_mediakit_free_count";

export default function MediaKit() {
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async (formData) => {
    const count = parseInt(localStorage.getItem(FREE_LIMIT_KEY) || "0", 10);
    if (count >= 1) {
      setShowLimitPopup(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await base44.functions.invoke("generateMediaKit", formData);
      setResult(res);
      localStorage.setItem(FREE_LIMIT_KEY, String(count + 1));

      setTimeout(() => {
        const el = document.querySelector("#result-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      setError(err.message || "Failed to generate media kit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Creator Media Kit</h1>
            <p className="text-sm text-gray-400">Generate a professional media kit with AI</p>
          </div>
        </div>
      </div>

      {/* Tool + Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Info */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white">
              Create Your Influencer{" "}
              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Media Kit
              </span>{" "}
              With AI
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              Generate a professional media kit in seconds. Showcase your audience,
              platforms, and partnership opportunities to attract brands and
              collaborations.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Sparkles className="text-pink-400" size={18} />
                <span className="text-sm">AI-powered</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <TrendingUp className="text-fuchsia-400" size={18} />
                <span className="text-sm">Audience analytics</span>
              </div>
            </div>
          </div>

          {/* Right: Tool */}
          <div id="media-kit">
            <MediaKitTool onGenerate={handleGenerate} isGenerating={isGenerating} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div id="result-section">
          <MediaKitResult result={result} />
        </div>
      )}

      <FreeLimitPopup open={showLimitPopup} onClose={setShowLimitPopup} />
    </div>
  );
}