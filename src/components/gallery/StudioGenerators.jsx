import React, { useState } from "react";
import { Sparkles, Wand2, Loader2, Download, ImagePlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LOGO_STYLES = [
  "Modern minimalist geometric mark",
  "Bold gradient tech emblem",
  "Clean monogram lettermark",
  "Abstract organic shape",
  "Sharp angular fintech mark",
];

// Adapted to use the existing aiImageGen backend function instead of generateLogo.
export default function StudioGenerators({ config, onChange }) {
  const [logoStyle, setLogoStyle] = useState(LOGO_STYLES[0]);
  const [logoUrl, setLogoUrl] = useState(config.logoImage || "");
  const [busyLogo, setBusyLogo] = useState(false);
  const [err, setErr] = useState("");

  const genLogo = async () => {
    setErr("");
    setBusyLogo(true);
    try {
      const prompt = `A professional logo for "${config.logoText || "Strategic Minds"}", ${logoStyle}, using primary color ${config.primaryColor} and accent ${config.secondaryColor}, clean vector style, on white background, centered, high quality`;
      const res = await base44.functions.invoke("aiImageGen", { prompt });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setLogoUrl(data.url);
    } catch (e) {
      setErr(e?.message || "Logo generation failed");
    } finally {
      setBusyLogo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-4 mt-4 border-t border-white/10">
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />AI Generators
      </div>

      <div>
        <div className="text-xs font-bold mb-1.5 text-white">Logo generator</div>
        <select
          value={logoStyle}
          onChange={(e) => setLogoStyle(e.target.value)}
          className="h-9 px-2 mb-2 w-full rounded-lg border border-white/10 bg-white/5 text-sm text-white"
        >
          {LOGO_STYLES.map((s) => (
            <option key={s} className="bg-[#0a0a0a]">{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={genLogo}
            disabled={busyLogo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white disabled:opacity-50"
          >
            {busyLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            Generate
          </button>
          {logoUrl && (
            <a
              href={logoUrl}
              download="logo.png"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-pink-400"
            >
              <Download className="w-3.5 h-3.5" />Download
            </a>
          )}
        </div>
        {logoUrl && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={logoUrl}
              alt="Generated logo"
              className="h-12 w-12 rounded-lg border border-white/10 bg-white/5 p-1 object-contain"
            />
            <button
              onClick={() => onChange({ ...config, logoImage: logoUrl })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-pink-400"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {config.logoImage === logoUrl ? "In previews ✓" : "Use in previews"}
            </button>
          </div>
        )}
      </div>

      {err && <div className="text-xs text-red-400">{err}</div>}
    </div>
  );
}