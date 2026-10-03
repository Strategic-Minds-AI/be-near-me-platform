import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Clock3, Heart, Leaf, ShieldCheck, Sparkles, Users } from "lucide-react";
import { BnmLockedScreen, Glass, GradientButton, MediaBackdrop, Pill, asItems } from "@/components/bnm/LockedShell";

function daysRemaining(expiresAt) {
  if (!expiresAt) return "—";
  const delta = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(delta)) return "—";
  return Math.max(0, Math.ceil(delta / 86400000));
}

export default function BnmLockedChallenge() {
  const { challengeId } = useParams();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: dares = [], isLoading } = useQuery({
    queryKey: ["bnm-lock-dares-v2", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const incoming = asItems(await base44.entities.Dare.filter({ challenger_email: user.email }, "-created_date", 25));
      const outgoing = asItems(await base44.entities.Dare.filter({ initiator_email: user.email }, "-created_date", 25));
      return [...incoming, ...outgoing].filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index);
    },
  });

  const selected = dares.find((d) => String(d.id) === String(challengeId)) || dares[0] || null;
  const title = selected?.challenge_text || "Hold the Door Open Challenge";
  const status = selected?.status ? String(selected.status).replaceAll("_", " ") : "Community challenge";
  const days = daysRemaining(selected?.expires_at);
  const reward = selected ? Number(selected.infinity_coin_stake || 0) : null;

  return (
    <BnmLockedScreen activeSection="Kindness">
      <div className="px-2 pt-1">
        <MediaBackdrop src={selected?.video_url} className="min-h-[360px] border border-[#263f68]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(255,74,176,.2),transparent_30%),linear-gradient(180deg,rgba(1,8,19,.05),rgba(2,8,18,.1)_35%,rgba(1,6,16,.92)_100%)]" />
          <div className="relative flex min-h-[360px] flex-col p-4">
            <div className="flex items-center justify-between">
              <Pill active><Leaf className="h-3.5 w-3.5" /> Kindness Challenge</Pill>
              <Pill>{status}</Pill>
            </div>
            <div className="mt-auto">
              <h1 className="max-w-[340px] text-[34px] font-black leading-[.96] tracking-[-.045em]">{title}</h1>
              <p className="mt-3 max-w-[345px] text-[12px] leading-5 text-[#dce6f6]">
                A small moment of kindness can make someone’s day. Keep it safe, respectful, and genuinely helpful.
              </p>
            </div>
          </div>
        </MediaBackdrop>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Glass className="p-3">
            <Clock3 className="h-4.5 w-4.5 text-[#ab7bff]" />
            <div className="mt-2 text-[18px] font-black">{days === "—" ? "—" : days + "d"}</div>
            <div className="text-[9px] leading-4 text-[#8497b9]">Time left</div>
          </Glass>
          <Glass className="p-3">
            <Users className="h-4.5 w-4.5 text-[#66c8ff]" />
            <div className="mt-2 text-[18px] font-black">—</div>
            <div className="text-[9px] leading-4 text-[#8497b9]">People joined</div>
          </Glass>
          <Glass className="p-3">
            <Heart className="h-4.5 w-4.5 text-[#ff4eaf]" />
            <div className="mt-2 text-[18px] font-black">{reward === null ? "—" : reward}</div>
            <div className="text-[9px] leading-4 text-[#8497b9]">Reward units</div>
          </Glass>
        </div>

        <Glass className="mt-2 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black">Challenge Rules</h2>
            <span className="text-[9px] font-bold text-[#8496b7]">4 simple steps</span>
          </div>
          <div className="mt-4 space-y-3.5">
            {[
              ["1","Hold the door open for someone","Choose a safe public setting and never pressure someone to be recorded."],
              ["2","Capture the moment only with consent","A proof clip can focus on you or the action without filming strangers."],
              ["3","Share a kind caption","Keep names, locations, and personal details private unless they are intentionally public."],
              ["4","Submit for verification","Rewards only unlock after the real challenge record meets its validation rules."],
            ].map(([n,h,b]) => (
              <div key={n} className="grid grid-cols-[38px_1fr] gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#c846ff] to-[#4b79ff] text-[13px] font-black shadow-[0_0_16px_rgba(120,75,255,.25)]">{n}</span>
                <div>
                  <div className="text-[12px] font-black leading-4">{h}</div>
                  <div className="mt-0.5 text-[10px] leading-4 text-[#8fa1c3]">{b}</div>
                </div>
              </div>
            ))}
          </div>
        </Glass>

        <Link to="/Dares" className="mt-3 block">
          <GradientButton className="w-full py-3.5 text-[15px]">
            <Sparkles className="mr-1 inline h-4.5 w-4.5" />
            {selected ? "Open Challenge" : "Join / Create Challenge"}
            <ChevronRight className="ml-2 inline h-4.5 w-4.5" />
          </GradientButton>
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-2 pb-3 text-center text-[8px] leading-3 text-[#8295b8]">
          <div><Users className="mx-auto mb-1 h-4.5 w-4.5 text-[#d15dff]" />Kinder community</div>
          <div><ShieldCheck className="mx-auto mb-1 h-4.5 w-4.5 text-[#5fe0ff]" />Safe and respectful</div>
          <div><Heart className="mx-auto mb-1 h-4.5 w-4.5 text-[#ff5ab9]" />Positive action</div>
        </div>
        {isLoading ? <p className="sr-only">Loading challenges</p> : null}
      </div>
    </BnmLockedScreen>
  );
}
