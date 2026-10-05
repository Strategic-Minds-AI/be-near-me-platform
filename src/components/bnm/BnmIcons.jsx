import React from "react";

// Custom branded SVG icons for Be Near Me navigation.
// Brand gradient: #24c7ff → #8752ff → #ff37aa
// These replace generic lucide icons with bespoke marks that match the app identity.

const GRAD_ID = "bnm-grad";
const GRAD_STOPS = (
  <>
    <stop offset="0%" stopColor="#24c7ff" />
    <stop offset="50%" stopColor="#8752ff" />
    <stop offset="100%" stopColor="#ff37aa" />
  </>
);

function Defs() {
  return (
    <defs>
      <linearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="1">
        {GRAD_STOPS}
      </linearGradient>
      <linearGradient id="bnm-grad-v" x1="0" y1="0" x2="0" y2="1">
        {GRAD_STOPS}
      </linearGradient>
    </defs>
  );
}

// ── Bottom Nav Icons ──

export function BnmHomeIcon({ active = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      {active ? (
        <>
          <path d="M14 3.5L4 10.5V24h7v-6.5h6V24h7V10.5L14 3.5z" fill="url(#bnm-grad)" />
          <path d="M14 3.5L4 10.5V24h7v-6.5h6V24h7V10.5L14 3.5z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      ) : (
        <path d="M14 3.5L4 10.5V24h7v-6.5h6V24h7V10.5L14 3.5z" fill="none" stroke="#8494bd" strokeWidth="2" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function BnmExploreIcon({ active = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="14" cy="14" r="10.5" fill="none" stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="2" />
      <path d="M18.5 9.5L15.5 15.5L9.5 18.5L12.5 12.5L18.5 9.5z" fill={active ? "url(#bnm-grad)" : "none"} stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmCreateIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="3" y="3" width="28" height="28" rx="9" fill="url(#bnm-grad)" />
      <rect x="3" y="3" width="28" height="28" rx="9" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
      <path d="M17 9.5V24.5M9.5 17H24.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="17" cy="17" r="13" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.8" strokeDasharray="2 3" />
    </svg>
  );
}

export function BnmInboxIcon({ active = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M5 9.5C5 7.6 6.6 6 8.5 6h11C21.4 6 23 7.6 23 9.5v6c0 1.9-1.6 3.5-3.5 3.5H13l-4.5 4v-4h0C6.6 19 5 17.4 5 15.5v-6z" fill={active ? "url(#bnm-grad)" : "none"} stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="10" cy="12.5" r="1.3" fill={active ? "white" : "#8494bd"} />
      <circle cx="14" cy="12.5" r="1.3" fill={active ? "white" : "#8494bd"} />
      <circle cx="18" cy="12.5" r="1.3" fill={active ? "white" : "#8494bd"} />
    </svg>
  );
}

export function BnmProfileIcon({ active = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="14" cy="14" r="10.5" fill="none" stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="2" />
      <circle cx="14" cy="11" r="3.8" fill={active ? "url(#bnm-grad)" : "none"} stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="1.8" />
      <path d="M7.5 21.5c1.2-3.2 3.8-4.5 6.5-4.5s5.3 1.3 6.5 4.5" fill="none" stroke={active ? "url(#bnm-grad)" : "#8494bd"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Feed Action Rail Icons (TikTok-style right side) ──

export function BnmLikeIcon({ filled = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M14 24.5l-1.3-1.2C7.5 18.5 4 15.3 4 11.4 4 8.4 6.3 6 9.2 6c1.7 0 3.3.8 4.3 2l.5.6.5-.6c1-1.2 2.6-2 4.3-2C21.7 6 24 8.4 24 11.4c0 3.9-3.5 7.1-8.7 11.9L14 24.5z" fill={filled ? "url(#bnm-grad)" : "white"} stroke={filled ? "url(#bnm-grad)" : "white"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmCommentIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 8.5C5 7 6.2 6 7.8 6h12.4C21.8 6 23 7 23 8.5v7c0 1.5-1.2 2.5-2.8 2.5H12l-4.5 3.5V18H7.8C6.2 18 5 17 5 15.5v-7z" fill="white" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmBookmarkIcon({ filled = false, size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M7 5.5h14v17l-7-4.5-7 4.5v-17z" fill={filled ? "url(#bnm-grad)" : "none"} stroke={filled ? "url(#bnm-grad)" : "white"} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmShareIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4.5v13M14 4.5L9.5 9M14 4.5L18.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M6 15v6.5C6 22.4 6.6 23 7.5 23h13c.9 0 1.5-.6 1.5-1.5V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmPlusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1.5v11M1.5 7h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Top Chrome Icons ──

export function BnmBellIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M12 3a5 5 0 015 5v3.5l1.5 3h-13L7 11.5V8a5 5 0 015-5z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 004 0" stroke="url(#bnm-grad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmLocationIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M9 16.5s6-5.2 6-9.5a6 6 0 10-12 0c0 4.3 6 9.5 6 9.5z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="2.2" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmPlayIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M3 2.5v9l7-4.5-7-4.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmSparkleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M7 1.5l1.2 3.8L12 6.5l-3.8 1.2L7 11.5l-1.2-3.8L2 6.5l3.8-1.2L7 1.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmLeafIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 12c0-5 3-9 10-10-1 7-5 10-10 10z" fill="url(#bnm-grad)" />
      <path d="M4 10c1.5-2.5 3.5-4 6-5" stroke="white" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmMusicIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M5 2.5h6v7a2 2 0 11-2-2h.5V4.5H5v5a2 2 0 11-2-2h.5V2.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}