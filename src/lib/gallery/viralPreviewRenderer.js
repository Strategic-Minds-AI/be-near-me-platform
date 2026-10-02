// Renders ultra high-quality 9:16 vertical video template previews as live HTML.
import { VIRAL_TEMPLATES, VIRAL_CATEGORIES } from "./viralTemplates.js";

export { VIRAL_TEMPLATES, VIRAL_CATEGORIES };

export function renderViralPreview(template, config = {}) {
  const p = template.preview || {};
  const gradient = p.gradient || "linear-gradient(to bottom, #1a1a1a, #0a0a0a)";
  const icon = p.icon || "🎬";
  const hookText = p.hookText || template.tagline;
  const textPos = p.textPos || "center";

  const textColor = "#FFFFFF";
  const accentColor = (template.color_palette && template.color_palette[0]) || "#FF006E";

  // Position styles
  const posStyle =
    textPos === "top"
      ? "top: 12%; left: 50%; transform: translateX(-50%);"
      : textPos === "bottom"
      ? "bottom: 10%; left: 50%; transform: translateX(-50%);"
      : "top: 50%; left: 50%; transform: translate(-50%, -50%);";

  // Font size based on config
  const textScale = config.textScale || 1;
  const fontScale = config.fontSize || 16;

  const html = `
    <div style="
      width: 100%; height: 100%; position: relative; overflow: hidden;
      background: ${gradient};
      font-family: ${config.fontFamily || "'Inter', system-ui, sans-serif"};
      border-radius: 12px;
    ">
      <!-- Animated grain overlay -->
      <div style="
        position: absolute; inset: 0; opacity: 0.08; pointer-events: none;
        background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%),
                          radial-gradient(circle at 80% 70%, rgba(0,0,0,0.2) 0%, transparent 50%);
      "></div>

      <!-- Light leak -->
      <div style="
        position: absolute; top: -20%; left: -10%; width: 120%; height: 60%;
        background: radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 70%);
        pointer-events: none;
      "></div>

      <!-- Icon (large, centered, semi-transparent) -->
      <div style="
        position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);
        font-size: ${48 * textScale}px; opacity: 0.9;
        filter: drop-shadow(0 4px 20px rgba(0,0,0,0.4));
        line-height: 1;
      ">${icon}</div>

      <!-- Hook text -->
      <div style="
        position: absolute; ${posStyle}
        text-align: center; width: 85%;
        font-size: ${fontScale * textScale}px;
        font-weight: 800;
        color: ${textColor};
        text-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 0 30px ${accentColor}40;
        line-height: 1.2;
        letter-spacing: -0.02em;
      ">${hookText}</div>

      <!-- Category badge -->
      <div style="
        position: absolute; top: 8%; left: 8%;
        padding: 3px 8px; border-radius: 20px;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
        font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.8);
        text-transform: uppercase; letter-spacing: 0.05em;
        border: 1px solid rgba(255,255,255,0.15);
      ">${template.category}</div>

      <!-- Duration badge -->
      <div style="
        position: absolute; top: 8%; right: 8%;
        padding: 3px 8px; border-radius: 20px;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
        font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.8);
        border: 1px solid rgba(255,255,255,0.15);
      ">${template.avg_duration}s</div>

      <!-- Bottom gradient scrim for text legibility -->
      <div style="
        position: absolute; bottom: 0; left: 0; right: 0; height: 40%;
        background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
        pointer-events: none;
      "></div>

      <!-- Brand text (if provided) -->
      ${config.logoText ? `
      <div style="
        position: absolute; bottom: 4%; left: 50%; transform: translateX(-50%);
        font-size: 8px; font-weight: 600; color: rgba(255,255,255,0.5);
        text-transform: uppercase; letter-spacing: 0.1em;
      ">${config.logoText}</div>` : ''}
    </div>
  `;

  return {
    frame: "mobile",
    designW: 270,
    designH: 480,
    html,
  };
}

export function viralCategoryFor(template) {
  return template.category || "Creative";
}