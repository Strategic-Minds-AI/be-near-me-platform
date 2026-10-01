import React from "react";
import { useNavigate } from "react-router-dom";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";

// BNM-01-SPLASH — Launch / entry screen.
// Full-screen, no layout wrapper, no bottom nav.
// "Get Started" navigates to /Home (existing TikTok feed).
export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden bg-bnm-bg">
      {/* Ambient violet glow at top */}
      <div
        className="absolute top-0 inset-x-0 h-1/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(111,32,255,0.10), transparent 70%)",
        }}
      />

      {/* Content layer (above glow) */}
      <div className="relative z-10 flex flex-col items-center w-full h-full">
        {/* Top spacer — pushes logo to ~35% */}
        <div style={{ flexGrow: 3 }} />

        {/* Logo pin mark */}
        <BnmLogoMark className="w-28 h-32 mb-6" />

        {/* Wordmark */}
        <h1 className="text-3xl font-extrabold tracking-tight text-bnm-text mb-20">
          BeNearMe
        </h1>

        {/* CTA Button — horizontal pink→magenta→violet gradient */}
        <button
          onClick={() => navigate("/Home")}
          className="w-[80%] h-12 rounded-full font-bold text-white text-base transition-transform active:scale-95"
          style={{
            background: "linear-gradient(90deg, #FF0080 0%, #CE07E3 50%, #6F20FF 100%)",
            boxShadow: "0 0 30px rgba(206,7,227,0.35)",
          }}
        >
          Get Started
        </button>

        {/* Bottom spacer — pushes secondary text to ~88% */}
        <div style={{ flexGrow: 2 }} />

        {/* Secondary text */}
        <p className="text-xs text-bnm-secondary text-center leading-relaxed mb-5 px-6">
          By continuing, you agree to our Terms of Service &amp; Privacy Policy
        </p>

        {/* Home indicator */}
        <div className="w-32 h-2 bg-white/80 rounded-full mb-2" />
      </div>
    </div>
  );
}