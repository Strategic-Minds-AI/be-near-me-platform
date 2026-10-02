import React, { useMemo } from "react";

/**
 * TemplateStylePreview — renders a CSS-based 9:16 visual preview from the
 * template's actual style DNA (color palette, font style, visual effects,
 * text overlay style, hook pattern). This is NOT a stock photo — it's a
 * deterministic visual representation of what the generated video will look like.
 *
 * When AI credits are available, the backend function `generateTemplateThumbnails`
 * can upgrade these to real AI-generated images stored in thumbnail_url.
 */
export default function TemplateStylePreview({ template, className = "" }) {
  const palette = template?.color_palette?.length
    ? template.color_palette
    : ["#1a1a2e", "#16213e", "#0f3460", "#e94560"];

  // Build a unique gradient from the template's actual color palette
  const bgGradient = useMemo(() => {
    if (palette.length >= 3) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 35%, ${palette[2]} 70%, ${palette[3] || palette[2]} 100%)`;
    }
    if (palette.length === 2) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
    }
    if (palette.length === 1) {
      return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[0]} 100%)`;
    }
    return "linear-gradient(135deg, #1a1a2e 0%, #e94560 100%)";
  }, [palette]);

  // Extract font weight from font_style description
  const fontWeight = useMemo(() => {
    const fs = (template?.font_style || "").toLowerCase();
    if (fs.includes("bold") || fs.includes("black") || fs.includes("heavy")) return "800";
    if (fs.includes("semibold") || fs.includes("medium")) return "600";
    return "700";
  }, [template?.font_style]);

  // Determine text transform from font_style
  const textTransform = useMemo(() => {
    const fs = (template?.font_style || "").toLowerCase();
    if (fs.includes("uppercase")) return "uppercase";
    return "none";
  }, [template?.font_style]);

  // Determine if text has outline/shadow
  const textShadow = useMemo(() => {
    const fs = (template?.font_style || "").toLowerCase();
    const tos = (template?.text_overlay_style || "").toLowerCase();
    if (fs.includes("outline") || tos.includes("outline")) {
      return "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000";
    }
    if (fs.includes("shadow") || tos.includes("shadow")) {
      return "0 2px 8px rgba(0,0,0,0.8)";
    }
    return "0 2px 12px rgba(0,0,0,0.6)";
  }, [template?.font_style, template?.text_overlay_style]);

  // Visual effects → CSS animations
  const hasSpeedRamp = (template?.visual_effects || []).some((e) =>
    e.toLowerCase().includes("speed")
  );
  const hasWhipPan = (template?.visual_effects || []).some((e) =>
    e.toLowerCase().includes("whip") || e.toLowerCase().includes("pan")
  );
  const hasMatchCut = (template?.visual_effects || []).some((e) =>
    e.toLowerCase().includes("match") || e.toLowerCase().includes("cut")
  );
  const hasZoom = (template?.visual_effects || []).some((e) =>
    e.toLowerCase().includes("zoom") || e.toLowerCase().includes("push")
  );

  // Hook text (first few words of hook_pattern)
  const hookText = useMemo(() => {
    const h = template?.hook_pattern || "";
    if (!h) return template?.tagline || "";
    // Take first sentence or first 40 chars
    const first = h.split(/[.!?\n]/)[0];
    return first.length > 45 ? first.slice(0, 42) + "…" : first;
  }, [template?.hook_pattern, template?.tagline]);

  // Accent color from palette (usually the most vibrant)
  const accentColor = palette[palette.length - 1] || "#e94560";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: bgGradient }}
    >
      {/* Animated visual effect layers */}
      {hasSpeedRamp && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accentColor}40 0%, transparent 60%)`,
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}
      {hasWhipPan && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor}30 50%, transparent 100%)`,
            animation: "whipPan 3s ease-in-out infinite",
          }}
        />
      )}
      {hasZoom && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${accentColor}50 0%, transparent 50%)`,
            animation: "zoomPulse 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Geometric pattern overlay for visual interest */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, ${accentColor}20 20px, ${accentColor}20 21px)`,
        }}
      />

      {/* Top: hook text (like a TikTok text overlay) */}
      <div className="absolute inset-x-0 top-0 p-3">
        <div
          className="inline-block rounded-md px-2 py-1 text-[10px] font-bold leading-tight"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
          }}
        >
          {hookText || "Hook"}
        </div>
      </div>

      {/* Center: style name in the template's font style */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <p
          className="text-center text-base leading-tight"
          style={{
            color: "#fff",
            fontWeight,
            textTransform,
            textShadow,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {template?.style_name?.split(" ").slice(0, 3).join(" ") || "Style"}
        </p>
      </div>

      {/* Bottom: color palette + category */}
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        {/* Color palette strip */}
        <div className="mb-1.5 flex gap-0.5 overflow-hidden rounded-sm">
          {palette.slice(0, 6).map((c, i) => (
            <div
              key={i}
              className="h-1.5 flex-1"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span
            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase"
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            {template?.category || "Viral"}
          </span>
          {template?.avg_duration && (
            <span
              className="rounded px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: "rgba(0,0,0,0.5)",
                color: accentColor,
                backdropFilter: "blur(4px)",
              }}
            >
              {template.avg_duration}s
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes whipPan {
          0%, 100% { transform: translateX(-20%); opacity: 0.1; }
          50% { transform: translateX(20%); opacity: 0.3; }
        }
        @keyframes zoomPulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}