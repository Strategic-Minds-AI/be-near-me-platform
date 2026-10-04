import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Coins, Crown, Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BnmLockedScreen, Glass, GradientButton, Pill, asItems } from "@/components/bnm/LockedShell";

const TIERS = [
  {
    tier: "free",
    title: "Community",
    price: "$0",
    coin: "0 Infinity Coin",
    detail: "Join, create, watch and participate without entering the coin economy.",
    features: ["Feed and discovery", "Create hub", "Camera and uploads", "Challenges and truths", "Community participation", "Basic creator profile"],
    icon: Users,
  },
  {
    tier: "member_10",
    title: "Member",
    price: "$10",
    coin: "25 Infinity Coin",
    detail: "Unlock Infinity Coin participation after verified payment.",
    features: ["Everything in Community", "25 IC verified membership grant", "Eligible IC activity rewards", "Coin-enabled reward activities"],
    icon: Coins,
  },
  {
    tier: "member_20",
    title: "Member Plus",
    price: "$20",
    coin: "50 Infinity Coin",
    detail: "Staging allocation; held as configurable economics until final approval.",
    features: ["Everything in Member", "50 IC staging membership grant", "Existing advanced creator tools when eligible", "Coin-enabled reward activities"],
    icon: Crown,
    inferred: true,
  },
];

async function safeCurrentUser() {
  try { return await base44.auth.me(); } catch { return null; }
}

export default function BnmMembership() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: safeCurrentUser });
  const { data: entitlementResult, refetch } = useQuery({
    queryKey: ["bnm-membership", user?.email],
    enabled: Boolean(user?.email),
    queryFn: () => base44.entities.MembershipEntitlement.filter(
      { user_email: user.email, status: "active" },
      { sort: "-created_date", limit: 10 }
    ),
  });
  const entitlement = asItems(entitlementResult)[0] || null;

  const requireAccount = () => {
    navigate("/account?next=" + encodeURIComponent("/membership"));
    return false;
  };

  const activateFree = async () => {
    if (!user?.email) return requireAccount();
    setBusy("free");
    setError("");
    try {
      const result = await base44.functions.invoke("activateFreeMembership", {});
      const data = result?.data || result;
      if (data?.error) throw new Error(data.error);
      await refetch();
    } catch (e) {
      setError(e?.message || "Free membership could not be activated.");
    } finally {
      setBusy("");
    }
  };

  const checkout = async (tier) => {
    if (!user?.email) return requireAccount();
    setBusy(tier);
    setError("");
    try {
      const result = await base44.functions.invoke("createPaymentCheckout", { product_key: tier === "member_10" ? "membership_10" : "membership_20" });
      const data = result?.data || result;
      if (!data?.checkout_url) throw new Error(data?.error || "Secure checkout is not configured.");
      window.location.assign(data.checkout_url);
    } catch (e) {
      setError(e?.message || "Secure checkout is unavailable.");
      setBusy("");
    }
  };

  const cryptoCheckout = (tier) => {
    if (!user?.email) return requireAccount();
    navigate("/crypto-membership?tier=" + encodeURIComponent(tier));
  };

  return (
    <BnmLockedScreen>
      <div className="px-3 py-4">
        <Glass className="p-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[#24c7ff] via-[#8752ff] to-[#ff37aa]">
            <Crown className="h-7 w-7" />
          </div>
          <Pill active className="mt-3">Membership</Pill>
          <h1 className="mt-3 text-[28px] font-black tracking-[-.045em]">Choose how you join</h1>
          <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[#98aacc]">
            Everyone can participate. Infinity Coin is optional and activates only for eligible paid memberships after payment verification.
          </p>
          {entitlement ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-black text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Active: {entitlement.tier}
            </div>
          ) : null}
        </Glass>

        {error ? (
          <div className="mt-3 rounded-[14px] border border-amber-400/30 bg-amber-400/10 p-3 text-[10px] leading-5 text-amber-100">{error}</div>
        ) : null}

        <div className="mt-3 grid gap-3">
          {TIERS.map((plan) => {
            const Icon = plan.icon;
            const current = entitlement?.tier === plan.tier;
            return (
              <Glass key={plan.tier} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br from-[#31c8ff] via-[#7b5cff] to-[#ff3cac]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[17px] font-black">{plan.title}</h2>
                      <span className="text-[18px] font-black">{plan.price}</span>
                    </div>
                    <div className="mt-1 text-[11px] font-black text-[#ff63bd]">{plan.coin}</div>
                    <p className="mt-1 text-[9px] leading-4 text-[#8fa2c3]">{plan.detail}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-[10px] leading-4 text-[#c7d2e8]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5eddbb]" /> {feature}
                    </div>
                  ))}
                </div>

                {plan.inferred ? (
                  <div className="mt-3 rounded-[12px] border border-[#7255b7]/40 bg-[#6f4ac8]/10 px-3 py-2 text-[8px] leading-4 text-[#bcaee0]">
                    50 IC is the proportional staging default and remains configurable pending final economic approval.
                  </div>
                ) : null}

                {plan.tier === "free" ? (
                  <GradientButton className="mt-4 w-full" disabled={current || busy === "free"} onClick={activateFree}>
                    {busy === "free" ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Activating…</> : current ? "Current Membership" : "Join Free"}
                  </GradientButton>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <GradientButton disabled={current || busy === plan.tier} onClick={() => checkout(plan.tier)}>
                      {busy === plan.tier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay securely"}
                    </GradientButton>
                    <button
                      type="button"
                      onClick={() => cryptoCheckout(plan.tier)}
                      className="rounded-full border border-[#506b9d] bg-[#0a1830] px-3 py-2 text-[10px] font-black text-white"
                    >
                      Crypto testnet
                    </button>
                  </div>
                )}
              </Glass>
            );
          })}
        </div>

        <Glass className="mt-3 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff59b9]" />
            <p className="text-[9px] leading-4 text-[#91a3c5]">
              Infinity Coin is a community utility/reward mechanism, not an investment and not a promise of profit or cash value. Blockchain grants remain fail-closed until a verified governed mint is available.
            </p>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
