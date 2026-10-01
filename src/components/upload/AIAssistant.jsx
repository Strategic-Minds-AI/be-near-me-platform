import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";

export default function AIAssistant({ videoTitle, videoCategory, onApply }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [applied, setApplied] = useState({});

  const generate = async () => {
    if (!videoTitle) return;
    setIsGenerating(true);
    setSuggestions(null);
    setApplied({});

    const res = await base44.functions.invoke("aiChat", {
      prompt: `You are an expert YouTube SEO assistant. Given the video title "${videoTitle}" in the "${videoCategory || "general"}" category, generate:
1. Three alternative optimized titles (catchy, SEO-friendly, under 70 chars each)
2. A compelling video description (150-200 words, includes keywords, ends with CTA)
3. Ten relevant tags (single words or short phrases, comma-separated)

Respond only as JSON.`,
      jsonSchema: {
        type: "object",
        properties: {
          titles: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    });

    setSuggestions(res.data);
    setIsGenerating(false);
  };

  const applyField = (field, value) => {
    onApply(field, value);
    setApplied(prev => ({ ...prev, [field]: true }));
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">AI Creator Assistant</span>
          <Badge className="bg-purple-500/20 text-purple-300 text-xs">Beta</Badge>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={isGenerating || !videoTitle}
          className="bg-purple-600 hover:bg-purple-700 rounded-full gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
          ) : suggestions ? (
            <><RefreshCw className="w-3 h-3" /> Regenerate</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Generate ideas</>
          )}
        </Button>
      </div>

      {!suggestions && !isGenerating && (
        <p className="text-gray-400 text-sm">
          Generate AI-powered titles, descriptions, and tags based on your video.
          {!videoTitle && <span className="text-yellow-400"> Enter a title first.</span>}
        </p>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 py-4 justify-center">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-gray-400">Crafting suggestions...</span>
        </div>
      )}

      {suggestions && (
        <div className="space-y-4">
          {/* Title suggestions */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Suggested Titles</p>
            <div className="space-y-2">
              {suggestions.titles?.map((title, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl group">
                  <p className="flex-1 text-white text-sm">{title}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => applyField("title", title)}
                    className={`flex-shrink-0 text-xs rounded-full px-3 ${applied[`title_${i}`] ? "text-green-400" : "text-purple-400 hover:text-purple-300"}`}
                  >
                    {applied[`title_${i}`] ? <Check className="w-3 h-3" /> : "Use"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {suggestions.description && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Suggested Description</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyField("description", suggestions.description)}
                  className={`text-xs rounded-full px-3 ${applied.description ? "text-green-400" : "text-purple-400 hover:text-purple-300"}`}
                >
                  {applied.description ? <><Check className="w-3 h-3 mr-1" />Applied</> : "Use this"}
                </Button>
              </div>
              <p className="text-gray-300 text-sm bg-white/5 rounded-xl p-3 line-clamp-4">
                {suggestions.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {suggestions.tags?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Suggested Tags</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyField("tags", suggestions.tags.join(", "))}
                  className={`text-xs rounded-full px-3 ${applied.tags ? "text-green-400" : "text-purple-400 hover:text-purple-300"}`}
                >
                  {applied.tags ? <><Check className="w-3 h-3 mr-1" />Applied</> : "Use all"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.tags.map((tag, i) => (
                  <Badge key={i} className="bg-white/10 text-gray-300 cursor-pointer hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                    onClick={() => applyField("tags", tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}