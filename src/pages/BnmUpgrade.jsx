import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { bnmData } from "@/services/bnmData";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";
import {
  BnmBackIcon, BnmCheckIcon, BnmSpinnerIcon,
  BnmFreeTierIcon, BnmPlusTierIcon, BnmProTierIcon
} from "@/components/bnm/BnmIcons";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Start exploring",
    icon: BnmFreeTierIcon,
    gradient: "linear-gradient(135deg, #3B82F6, #6366F1)",
    features: ["Watch viral videos", "Browse the feed", "Basic AI video templates", "Community access"],
    cta: "Get Started Free",
  },
  {
    id: "plus",
    name: "Plus",
    price: "$10",
    period: "one-time",
    tagline: "Create like a pro",
    icon: BnmPlusTierIcon,
    gradient: "linear-gradient(135deg, #8B5CF6, #EC4899)",
    features: ["Everything in Free", "100 AI video templates", "HD video generation", "Priority rendering", "No watermark"],
    cta: "Get Plus",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "one-time",
    tagline: "Go viral faster",
    icon: BnmProTierIcon,
    gradient: "linear-gradient(135deg, #EC4899, #F59E0B)",
    features: ["Everything in Plus", "Unlimited AI generations", "4K video generation", "Advanced viral templates", "Analytics dashboard", "Early access features"],
    cta: "Get Pro",
  },
];

export default function BnmUpgrade() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  const handleSelect = async (tier) => {
    setError(null);
    if (tier.id === "free") {
      navigate("/home");
      return;
    }

    setLoadingId(tier.id);
    try {
      // Paid tiers are account entitlements. Require an authenticated BNM
      // identity before checkout so successful payments can be granted
      // deterministically to the buyer's creator profile.
      try {
        await bnmData.auth.me();
      } catch {
        navigate("/login?returnTo=" + encodeURIComponent("/upgrade"));
        return;
      }

      const res = await bnmData.functions.invoke("create-checkout", { productId: tier.id });
      const redirectUrl = res.data?.redirectUrl;
      if (!redirectUrl) {
        throw new Error(res.data?.error || "Could not start checkout");
      }
      window.location.href = redirectUrl;
    } catch (e) {
      setError(e.message || "Payment failed to start. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-y-auto bg-bnm-bg">
      {/* Ambient gradient glow at top */}
      <div
        className="absolute top-0 inset-x-0 h-1/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(139,92,246,0.15), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-1/4 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(236,72,153,0.10), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-4 py-10">
        {/* Back to feed */}
        <div className="absolute top-[max(env(safe-area-inset-top),16px)] left-4 z-20">
          <Link to="/home" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur hover:bg-white/10">
            <BnmBackIcon size={16} /> Back to feed
          </Link>
        </div>

        {/* Logo */}
        <BnmLogoMark className="w-20 h-24 mb-4" />

        {/* Wordmark */}
        <h1
          className="mb-2 text-4xl font-black tracking-tight"
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

        <p
          className="mb-1 text-center text-xs font-bold uppercase tracking-[0.32em] text-white"
          style={{ textShadow: "0 0 14px rgba(96,165,250,0.5), 0 0 28px rgba(236,72,153,0.3)" }}
        >
          People · Places · Moments
        </p>
        <p
          className="mb-8 text-center text-xs font-bold uppercase tracking-[0.32em] text-white"
          style={{ textShadow: "0 0 14px rgba(96,165,250,0.5), 0 0 28px rgba(236,72,153,0.3)" }}
        >
          Near You
        </p>

        {/* Pricing header */}
        <h2 className="mb-1 text-lg font-extrabold text-white">Choose your plan</h2>
        <p className="mb-6 text-center text-xs text-bnm-secondary">
          No sign-up needed. Pick a tier and start creating.
        </p>

        {/* Tier cards */}
        <div className="flex w-full max-w-md flex-col gap-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isLoading = loadingId === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 splash-electric-btn ${
                  tier.popular
                    ? "border-fuchsia-500/50 bg-white/[0.06]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: tier.gradient }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Name */}
                  <h3 className="mt-3 text-base font-extrabold text-white">{tier.name}</h3>
                  <span className="text-xs font-medium text-bnm-secondary">{tier.tagline}</span>

                  {/* Price */}
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">{tier.price}</span>
                    <span className="text-[10px] text-bnm-secondary">/ {tier.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-3 space-y-1.5 text-center">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center justify-center gap-2 text-[11px] text-white/80">
                      <BnmCheckIcon size={14} className="shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelect(tier)}
                  disabled={loadingId !== null}
                  className="splash-electric-btn mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-300 active:scale-95 disabled:opacity-50"
                  style={{
                    background: tier.gradient,
                    boxShadow: `0 0 20px ${tier.id === "plus" ? "rgba(139,92,246,0.3)" : tier.id === "pro" ? "rgba(236,72,153,0.3)" : "rgba(59,130,246,0.3)"}`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <BnmSpinnerIcon size={16} /> Redirecting to checkout...
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Footer */}
        <p
          className="mt-8 text-center text-xs font-semibold text-white"
          style={{ textShadow: "0 0 12px rgba(96,165,250,0.4), 0 0 24px rgba(236,72,153,0.25)" }}
        >
          Create · Watch · Explore · Connect
        </p>
        <p className="mt-2 text-center text-[10px] text-bnm-secondary">
          Secure checkout powered by Base44 Payments
        </p>

        {/* Home indicator */}
        <div className="mt-6 h-1.5 w-28 rounded-full bg-white/30" />
      </div>
    </div>
  );
}