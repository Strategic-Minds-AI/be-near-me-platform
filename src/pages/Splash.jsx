import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";

// BNM-01-SPLASH — Launch / entry screen.
// Full-screen, no layout wrapper, no bottom nav.
// Visual-lock entry screen for the approved B Near Me mobile experience.
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

        {/* Wordmark — large creative gradient */}
        <h1
          className="mb-5 text-5xl font-black tracking-tight"
          style={{
            background: "linear-gradient(90deg, #60A5FA 0%, #A78BFA 35%, #EC4899 70%, #60A5FA 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 18px rgba(168,139,250,0.45))",
          }}
        >
          B NEAR ME
        </h1>

        {/* Tagline — larger, creative, white */}
        <p
          className="mb-16 text-center text-sm font-bold uppercase tracking-[0.32em] text-white"
          style={{ textShadow: "0 0 14px rgba(96,165,250,0.5), 0 0 28px rgba(236,72,153,0.3)" }}
        >
          People · Places · Moments<br />Near You
        </p>

        {/* CTA Button — electric blue→purple→pink gradient with glow hover */}
        <button
          onClick={() => navigate("/home")}
          className="splash-electric-btn w-[80%] h-12 rounded-full font-bold text-white text-base transition-all duration-300 active:scale-95"
          style={{
            background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
            boxShadow: "0 0 30px rgba(139,92,246,0.35)",
          }}
        >
          Get Started
        </button>

        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="splash-electric-btn mt-4 h-12 w-[80%] rounded-full border border-violet-500/60 bg-[#0c1020]/85 text-base font-bold text-white transition-all duration-300 active:scale-95"
        >
          Log In
        </button>

        {/* Bottom spacer — pushes secondary text to ~88% */}
        <div style={{ flexGrow: 2 }} />

        {/* Secondary text — larger, creative, white */}
        <p
          className="text-center text-sm font-semibold leading-relaxed mb-5 px-6 text-white"
          style={{ textShadow: "0 0 12px rgba(96,165,250,0.4), 0 0 24px rgba(236,72,153,0.25)" }}
        >
          Create · Watch · Explore · Connect
        </p>

        {/* Home indicator */}
        <div className="w-32 h-2 bg-white/80 rounded-full mb-2" />
      </div>
    </div>
  );
}