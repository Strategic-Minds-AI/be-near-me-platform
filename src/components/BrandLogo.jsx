import React from "react";

// Transparent BeNearMe logo recreated from the approved brand mark.
// Silver (top) → hot pink → magenta-purple (bottom), with a soft pink glow.
export default function BrandLogo({ className = "h-8" }) {
  return (
    <svg viewBox="0 0 244 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BeNearMe">
      <defs>
        <linearGradient id="bnm-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F4" />
          <stop offset="0.42" stopColor="#FF0080" />
          <stop offset="1" stopColor="#D600FF" />
        </linearGradient>
        <linearGradient id="bnm-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#E0E0E0" />
          <stop offset="1" stopColor="#B8B8B8" />
        </linearGradient>
        <filter id="bnm-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#FF0080" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter="url(#bnm-glow)">
        <path
          d="M28 4 C16 4 6 14 6 27 C6 41 22 55 28 60 C34 55 50 41 50 27 C50 14 40 4 28 4 Z"
          fill="url(#bnm-grad)"
        />
        <ellipse cx="28" cy="20" rx="13" ry="7.5" fill="url(#bnm-silver)" opacity="0.6" />
        <text
          x="28" y="35"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="26" fontWeight="800"
          fill="#ffffff" textAnchor="middle"
        >
          b
        </text>
      </g>

      <text
        x="64" y="43"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="30" fontWeight="800" letterSpacing="-0.5"
        fill="url(#bnm-grad)" filter="url(#bnm-glow)"
      >
        BeNearMe
      </text>
    </svg>
  );
}