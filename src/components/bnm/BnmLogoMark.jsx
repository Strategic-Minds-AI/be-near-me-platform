import React from "react";

// B Near Me logo pin mark — the "b" location pin.
// Gradient: pink (top) → magenta (mid) → violet (bottom), with pink glow.
// FROZEN after validation — do not restyle on later screens.
export default function BnmLogoMark({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 56 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="B Near Me">
      <defs>
        <linearGradient id="bnm-mark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF0080" />
          <stop offset="0.5" stopColor="#CE07E3" />
          <stop offset="1" stopColor="#6F20FF" />
        </linearGradient>
        <linearGradient id="bnm-mark-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#E0E0E0" />
          <stop offset="1" stopColor="#B8B8B8" />
        </linearGradient>
        <filter id="bnm-mark-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FF0080" floodOpacity="0.55" />
        </filter>
      </defs>
      <g filter="url(#bnm-mark-glow)">
        <path
          d="M28 4 C16 4 6 14 6 27 C6 41 22 55 28 60 C34 55 50 41 50 27 C50 14 40 4 28 4 Z"
          fill="url(#bnm-mark-grad)"
        />
        <ellipse cx="28" cy="20" rx="13" ry="7.5" fill="url(#bnm-mark-silver)" opacity="0.6" />
        <text
          x="28" y="35"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="26" fontWeight="800"
          fill="#ffffff" textAnchor="middle"
        >
          b
        </text>
      </g>
    </svg>
  );
}