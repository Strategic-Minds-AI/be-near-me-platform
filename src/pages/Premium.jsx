import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Check, Crown, ShieldCheck, Sparkles, Star } from "lucide-react";
import { BnmLockedScreen, Glass, GradientButton, Pill, asItems } from "@/components/bnm/LockedShell";

const VIEWER_FEATURES = [
  "Ad-free viewing where supported",
  "Higher-quality playback options",
  "Premium profile badge",
  "Early access to eligible features",
];

const CREATOR_FEATURES = [
  "Everything in Viewer Premium",
  "Advanced creator analytics",
  "AI creator tools when available",
  "Priority eligible processing",
];

export default function Premium() {
  const [billing, setBilling] = useState("monthly");
  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: subscriptionResult } = useQuery({
    queryKey: ["mySubscription", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.PremiumSubscription.filter({ created_by: user.email }),
  });
  const subscriptions = asItems(subscriptionResult);
  const activeSub = subscriptions.find((s) => s.status === "active");

  const checkout = async (tier) => {
    if (!user) return base44.auth.redirectToLogin();
    const key = tier + "_" + (billing === "yearly" ? "annual" : "monthly");
    setLoadingKey(key);
    setError("");
    try {
      const response = await base44.functions.invoke("createPaymentCheckout", { product_key: key });
      const data = response?.data || response;
      if (!data?.checkout_url) throw new Error(data?.error || "Secure checkout is not configured yet.");
      window.location.assign(data.checkout_url);
    } catch (e) {
      setError(e?.message || "Secure checkout is not available yet.");
      setLoadingKey("");
    }
  };

  const Plan = ({ tier, title, subtitle, icon: Icon, features }) => {
    const productKey = tier + "_" + (billing === "yearly" ? "annual" : "monthly");
    const current = activeSub?.plan?.includes(tier);
    return (
      <Glass className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#24c7ff] via-[#8752ff] to-[#ff37aa]"><Icon className="h-6 w-6"/></div>
          <div><h2 className="text-xl font-black">{title}</h2><p className="text-xs text-[#93a5c8]">{subtitle}</p></div>
        </div>
        <div className="mt-4"><Pill active>{billing === "yearly" ? "Annual billing" : "Monthly billing"}</Pill></div>
        <p className="mt-3 text-[11px] leading-5 text-[#8fa1c2]">The authoritative price, currency, taxes, and renewal terms are shown by the secure payment processor before purchase. This app does not hard-code an unverified price.</p>
        <ul className="mt-5 space-y-3">
          {features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-[#d9e3f6]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#55d7ff]"/>{feature}</li>)}
        </ul>
        <GradientButton className="mt-6 w-full" disabled={current || loadingKey === productKey} onClick={() => checkout(tier)}>
          {current ? "Current Plan" : loadingKey === productKey ? "Opening secure checkout…" : "Continue to Secure Checkout"}
        </GradientButton>
      </Glass>
    );
  };

  return (
    <BnmLockedScreen>
      <div className="px-3 py-5">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-[#24c7ff] via-[#8752ff] to-[#ff37aa]"><Crown className="h-7 w-7"/></div>
          <h1 className="mt-3 text-[30px] font-black tracking-[-.04em]">Be Near Me Premium</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#99aacc]">Optional upgrades support the platform. Platform net receipts are assigned 100% to the Eva & Anastasia Beneficiary Pool.</p>
        </div>

        <div className="mx-auto mt-5 flex w-fit rounded-full border border-[#334b76] bg-[#0b1931] p-1">
          <button onClick={()=>setBilling("monthly")} className={"rounded-full px-5 py-2 text-xs font-black "+(billing==="monthly"?"bg-white text-[#07101f]":"text-[#8fa3c8]")}>Monthly</button>
          <button onClick={()=>setBilling("yearly")} className={"rounded-full px-5 py-2 text-xs font-black "+(billing==="yearly"?"bg-white text-[#07101f]":"text-[#8fa3c8]")}>Annual</button>
        </div>

        {activeSub ? <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4"/>Active subscription detected</div> : null}
        {error ? <div className="mt-4 rounded-[14px] border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">{error}</div> : null}

        <div className="mt-5 grid gap-3">
          <Plan tier="viewer" title="Viewer Premium" subtitle="A cleaner viewing experience" icon={Star} features={VIEWER_FEATURES}/>
          <Plan tier="creator" title="Creator Pro" subtitle="Tools for positive creators" icon={Sparkles} features={CREATOR_FEATURES}/>
        </div>

        <Glass className="mt-4 p-4 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-[#55e2bd]"/>
          <h3 className="mt-2 font-black">Payments are server-side and auditable</h3>
          <p className="mt-1 text-[10px] leading-5 text-[#8498bc]">No card secret is stored in the app. Live checkout remains blocked until a verified legal Eva & Anastasia settlement destination is configured.</p>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
