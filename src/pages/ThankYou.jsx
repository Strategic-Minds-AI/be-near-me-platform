import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";
import { BnmCheckCircleIcon, BnmSpinnerIcon } from "@/components/bnm/BnmIcons";

export default function ThankYou() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate("/home");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-bnm-bg px-6">
      {/* Ambient glow */}
      <div
        className="absolute top-0 inset-x-0 h-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 50%, rgba(34,197,94,0.12), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <BnmLogoMark className="w-20 h-24 mb-6" />

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <BnmCheckCircleIcon size={36} />
        </div>

        <h1 className="mb-2 text-2xl font-black text-white">Payment successful!</h1>
        <p className="mb-6 text-sm text-bnm-secondary">
          Welcome to Be Near Me. Your account is now active.
        </p>

        <div className="flex items-center gap-2 text-xs text-bnm-secondary">
          <BnmSpinnerIcon size={16} />
          <span>Entering the app in {countdown}...</span>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="splash-electric-btn mt-6 rounded-full px-8 py-3 text-sm font-bold text-white transition-all duration-300 active:scale-95"
          style={{
            background: "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
            boxShadow: "0 0 30px rgba(139,92,246,0.35)",
          }}
        >
          Enter Now
        </button>
      </div>
    </div>
  );
}