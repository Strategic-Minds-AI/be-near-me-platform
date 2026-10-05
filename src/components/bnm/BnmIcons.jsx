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

// ── Utility / Pricing Icons ──

export function BnmBackIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmCheckIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <Defs />
      <path d="M2.5 7.5l3 3 6-6.5" stroke="url(#bnm-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmCheckCircleIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="18" cy="18" r="15" fill="none" stroke="url(#bnm-grad)" strokeWidth="2.5" />
      <path d="M11 18.5l4.5 4.5L25 12" stroke="url(#bnm-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmSpinnerIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
      <Defs />
      <circle cx="8" cy="8" r="6" fill="none" stroke="url(#bnm-grad)" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M8 2a6 6 0 016 6" fill="none" stroke="url(#bnm-grad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BnmHashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M5.5 1.5L4 12.5M10 1.5L8.5 12.5M2 5h10M1.5 9h10" stroke="url(#bnm-grad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmMapPinIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M6 11s4.5-3.8 4.5-7a4.5 4.5 0 10-9 0c0 3.2 4.5 7 4.5 7z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="6" cy="4.5" r="1.5" fill="url(#bnm-grad)" />
    </svg>
  );
}

// ── Pricing Tier Icons ──

export function BnmFreeTierIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M10 2l1.8 5.5L17 9l-5.2 1.5L10 16l-1.8-5.5L3 9l5.2-1.5L10 2z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmPlusTierIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmProTierIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M3 7l3 3 4-5 4 5 3-3v8a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" fill="url(#bnm-grad)" />
      <circle cx="10" cy="4" r="1.2" fill="url(#bnm-grad)" />
      <path d="M3 7l2 1M17 7l-2 1" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Template Gallery Icons ──

export function BnmFilmIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="2" y="3" width="12" height="10" rx="1.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M5 3v10M11 3v10M2 6h3M2 10h3M11 6h3M11 10h3" stroke="url(#bnm-grad)" strokeWidth="1.2" />
    </svg>
  );
}

export function BnmBoltIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M9 1.5L3 9h4l-1 5.5L13 7H9l1-5.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmSlidersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 4h7M11 4h3M2 8h3M7 8h7M2 12h9M13 12h1" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="4" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="6" cy="8" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="12" cy="12" r="1.5" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmCloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BnmAlertIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M8 2L14.5 13.5H1.5L8 2z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11v.5" stroke="url(#bnm-grad)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BnmWandIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M11 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="url(#bnm-grad)" />
      <path d="M3 13L10 6M3 13l-1 1M3 13l1 1" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BnmPlayCircleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="8" cy="8" r="6" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M6.5 5.5v5l4-2.5-4-2.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmHeartIcon({ size = 16, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M8 14l-1-1C3.5 10 2 8 2 5.8 2 3.8 3.5 2.5 5.3 2.5c1 0 2 .5 2.7 1.3l.5.6.5-.6c.7-.8 1.7-1.3 2.7-1.3C12.5 2.5 14 3.8 14 5.8c0 2.2-1.5 4.2-5 7.2L8 14z" fill={filled ? "url(#bnm-grad)" : "none"} stroke={filled ? "url(#bnm-grad)" : "currentColor"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmLeafSmallIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 14c0-6 4-11 12-12-1 8-6 12-12 12z" fill="url(#bnm-grad)" />
      <path d="M5 11c2-3 5-5 8-6" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmUsersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="6" cy="5.5" r="2.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M1.5 14c.5-2.5 2.5-3.5 4.5-3.5s4 1 4.5 3.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11.5" cy="6" r="2" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.3" />
      <path d="M10 14c.3-2 1.5-2.8 3-2.8s2.2.8 2.5 2.8" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function BnmChevronRightIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="8" cy="8" r="6" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.5 1.5" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmShieldIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M8 2L13 4v4c0 3-2.5 5-5 6-2.5-1-5-3-5-6V4L8 2z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.5 8l1.8 1.8L10.5 6.5" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmSearchIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BnmCalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M2 6h12M5 2v3M11 2v3" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BnmMicIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="6" y="2" width="4" height="8" rx="2" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M3.5 8a4.5 4.5 0 009 0M8 12.5v2" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BnmSendIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 8L14 3L9 14L7 9L2 8z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmPawIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="4" cy="5" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="8" cy="3.5" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="12" cy="5" r="1.5" fill="url(#bnm-grad)" />
      <ellipse cx="8" cy="10" rx="3.5" ry="2.8" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmGiftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="2" y="6" width="12" height="8" rx="1" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M2 9h12M8 6v8" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M8 6c-1-2-3-2-3-1s2 1 3 1zM8 6c1-2 3-2 3-1s-2 1-3 1z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmLockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <circle cx="8" cy="10.5" r="1" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmPackageIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M8 2L14 5v6L8 14L2 11V5L8 2z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 5l6 3 6-3M8 8v6" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmStarIcon({ size = 16, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M8 2l1.8 4.2L14 6.5l-3.2 3 1 4.5L8 11.8L4.2 14l1-4.5L2 6.5l4.2-.3L8 2z" fill={filled ? "url(#bnm-grad)" : "none"} stroke="url(#bnm-grad)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmCompassIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <circle cx="8" cy="8" r="6" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M10.5 5.5L8.8 8.8L5.5 10.5L7.2 7.2L10.5 5.5z" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmUtensilsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M4 2v4a1.5 1.5 0 003 0V2M5.5 2v12M11 2c-1 0-2 1-2 3v4c0 1 .5 2 2 2v3" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmTruckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="1.5" y="4" width="8" height="7" rx="1" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <path d="M9.5 6h3l2 2.5v2.5h-5V6z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="4.5" cy="12.5" r="1.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.3" />
      <circle cx="11.5" cy="12.5" r="1.5" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.3" />
    </svg>
  );
}

export function BnmChevronLeftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BnmSlidersHIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 5h2M6 5h8M2 8h8M12 8h2M2 11h5M9 11h5" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="5" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="11" cy="8" r="1.5" fill="url(#bnm-grad)" />
      <circle cx="8" cy="11" r="1.5" fill="url(#bnm-grad)" />
    </svg>
  );
}

export function BnmImagePlusIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
      <circle cx="7" cy="8" r="1.5" fill="url(#bnm-grad)" />
      <path d="M2 14l4-4 3 3 4-4 5 5" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M14 6v4M12 8h4" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BnmBarChartIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 14h12M4 14V8M7 14V5M10 14V10M13 14V3" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BnmEyeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M1.5 8S4 3.5 8 3.5S14.5 8 14.5 8S12 12.5 8 12.5S1.5 8 1.5 8z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" />
    </svg>
  );
}

export function BnmMessageIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M2 4.5C2 3.5 2.8 3 3.8 3h8.4C13.2 3 14 3.5 14 4.5v5c0 1-.8 1.5-1.8 1.5H7l-3.5 2.5V11H3.8C2.8 11 2 10.5 2 9.5v-5z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BnmTrophyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Defs />
      <path d="M4 2h8v4a4 4 0 01-8 0V2z" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 3H2v1.5C2 6 3 7 4 7M12 3h2v1.5C14 6 13 7 12 7" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10v2.5M5.5 14h5M6.5 14v-1.5h3V14" fill="none" stroke="url(#bnm-grad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}