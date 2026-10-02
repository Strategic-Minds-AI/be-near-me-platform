import React from "react";

// VisualDnaBadge — renders the visual DNA of a viral template:
// color palette swatches, font style, effects, symbols, text overlays, etc.
export default function VisualDnaBadge({ template }) {
  if (!template) return null;

  return (
    <div className="space-y-3">
      {/* Color palette */}
      {template.color_palette?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
            Color palette
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.color_palette.map((color, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
                <span
                  className="h-4 w-4 rounded border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] font-mono text-white/70">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Font style */}
      {template.font_style && (
        <DnaRow label="Typography" value={template.font_style} />
      )}

      {/* Visual effects */}
      {template.visual_effects?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
            Visual effects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.visual_effects.map((fx, i) => (
              <span
                key={i}
                className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-300"
              >
                {fx}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Text overlay style */}
      {template.text_overlay_style && (
        <DnaRow label="Text overlays" value={template.text_overlay_style} />
      )}

      {/* Symbols & motifs */}
      {template.symbols_motifs?.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8f9ab0]">
            Symbols & motifs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.symbols_motifs.map((sym, i) => (
              <span
                key={i}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transition style */}
      {template.transition_style && (
        <DnaRow label="Transitions" value={template.transition_style} />
      )}

      {/* Lighting */}
      {template.lighting_style && (
        <DnaRow label="Lighting" value={template.lighting_style} />
      )}

      {/* Thumbnail text pattern */}
      {template.thumbnail_text_pattern && (
        <DnaRow label="Thumbnail text" value={template.thumbnail_text_pattern} />
      )}
    </div>
  );
}

function DnaRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#788399] pt-0.5">
        {label}
      </span>
      <span className="flex-1 text-xs leading-5 text-white/85">{value}</span>
    </div>
  );
}