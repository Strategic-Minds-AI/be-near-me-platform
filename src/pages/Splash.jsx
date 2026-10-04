import { useNavigate } from "react-router-dom";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";

// BNM-01-SPLASH — Launch / entry screen.
// Google/Base44 login is intentionally not used as the product entry gate.
export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden bg-bnm-bg">
      <div
        className="absolute top-0 inset-x-0 h-1/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(111,32,255,0.10), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full h-full">
        <div style={{ flexGrow: 3 }} />

        <BnmLogoMark className="w-28 h-32 mb-6" />

        <h1 className="text-3xl font-extrabold tracking-tight text-bnm-text mb-20">
          B NEAR ME
        </h1>
        <p className="mb-14 text-center text-xs font-semibold uppercase tracking-[0.24em] text-bnm-secondary">
          People · Places · Moments<br />Near You
        </p>

        <button
          onClick={() => navigate("/home")}
          className="w-[80%] h-12 rounded-full font-bold text-white text-base transition-transform active:scale-95"
          style={{
            background: "linear-gradient(90deg, #FF0080 0%, #CE07E3 50%, #6F20FF 100%)",
            boxShadow: "0 0 30px rgba(206,7,227,0.35)",
          }}
        >
          Get Started
        </button>

        <button
          onClick={() => navigate("/create")}
          className="mt-4 h-12 w-[80%] rounded-full border border-violet-500/60 bg-[#0c1020]/85 text-base font-bold text-white transition-transform active:scale-95"
        >
          Open Create
        </button>

        <button
          onClick={() => navigate("/account")}
          className="mt-3 text-xs font-bold text-bnm-secondary underline decoration-violet-500/50 underline-offset-4"
        >
          Account
        </button>

        <div style={{ flexGrow: 2 }} />

        <p className="text-xs text-bnm-secondary text-center leading-relaxed mb-5 px-6">
          Create · Watch · Explore · Connect
        </p>

        <div className="w-32 h-2 bg-white/80 rounded-full mb-2" />
      </div>
    </div>
  );
}
