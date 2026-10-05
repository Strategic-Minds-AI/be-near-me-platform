import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AiCaptionInput({ value, onChange, placeholder, maxLength = 220, tags = [] }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const text = value.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Only auto-suggest when user types 1-5 words then pauses
    if (wordCount < 1 || wordCount > 5) {
      setSuggestion(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const tagHint = tags.length ? ` The video tags are: ${tags.join(", ")}.` : "";
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a viral short-form video caption writer for a kindness-focused community platform. The user started typing: "${text}".${tagHint} Write ONE complete, engaging caption (under 150 characters) that expands their idea into something viral and positive. Include 1-2 relevant emojis. Do NOT include hashtags. Return only the caption text, nothing else.`,
        });
        const text = typeof res === "string" ? res.trim() : res?.content?.trim() || "";
        if (text && text.length > wordCount) {
          setSuggestion(text);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }, 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, tags.join(",")]);

  const acceptSuggestion = () => {
    if (suggestion) {
      onChange(suggestion.slice(0, maxLength));
      setSuggestion(null);
    }
  };

  return (
    <div className="min-w-0 flex-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none bg-transparent text-[11px] leading-4 text-white outline-none placeholder:text-[#7e91b5]"
      />
      {/* AI suggestion */}
      {loading && (
        <div className="flex items-center gap-1.5 pt-1 text-[9px] text-[#8755ff]">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>AI assist thinking…</span>
        </div>
      )}
      {suggestion && !loading && (
        <button
          onClick={acceptSuggestion}
          className="mt-1.5 flex w-full items-start gap-1.5 rounded-lg border border-[#8755ff]/40 bg-[#8755ff]/10 p-2 text-left transition hover:bg-[#8755ff]/20"
        >
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#a78bfa]" />
          <span className="flex-1 text-[10px] leading-3.5 text-[#d9ccff]">{suggestion}</span>
          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
        </button>
      )}
    </div>
  );
}