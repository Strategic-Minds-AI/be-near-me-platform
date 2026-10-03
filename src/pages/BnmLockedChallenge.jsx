import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Clock3, Heart, Leaf, ShieldCheck, Users } from "lucide-react";
import { BnmLockedScreen, Glass, GradientButton, MediaBackdrop, Pill, asItems } from "@/components/bnm/LockedShell";

export default function BnmLockedChallenge() {
  const { challengeId } = useParams();
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: dares = [] } = useQuery({
    queryKey: ["bnm-lock-dares", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const incoming = asItems(await base44.entities.Dare.filter({ challenger_email: user.email }, "-created_date", 25));
      const outgoing = asItems(await base44.entities.Dare.filter({ initiator_email: user.email }, "-created_date", 25));
      return [...incoming, ...outgoing].filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index);
    },
  });

  const selected = dares.find((d) => String(d.id) === String(challengeId)) || dares[0];
  const title = selected?.challenge_text || "Hold the Door Open Challenge";
  const status = selected?.status || "community challenge";
  const rewardText = selected ? String(selected.infinity_coin_stake || 0) + " in-app reward units" : "Configured per real challenge";

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <MediaBackdrop src={selected?.video_url} className="min-h-[290px]">
          <div className="flex min-h-[290px] flex-col justify-end bg-[radial-gradient(circle_at_70%_20%,rgba(255,96,191,.18),transparent_30%)] p-5">
            <Pill active className="w-fit"><Leaf className="h-3.5 w-3.5" /> Kindness Challenge</Pill>
            <div className="mt-auto">
              <div className="max-w-[330px] text-[32px] font-black leading-[.98] tracking-[-.04em]">{title}</div>
              <div className="mt-3 text-sm font-semibold text-[#d5e0f5]">Small actions can make someone’s day and strengthen the community around you.</div>
            </div>
          </div>
        </MediaBackdrop>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Glass className="p-3">
            <Clock3 className="h-5 w-5 text-[#b77aff]" />
            <div className="mt-2 text-[12px] font-black capitalize">{status.replaceAll("_"," ")}</div>
            <div className="text-[10px] text-[#8194ba]">{selected?.expires_at ? new Date(selected.expires_at).toLocaleDateString() : "No fabricated countdown"}</div>
          </Glass>
          <Glass className="p-3">
            <Heart className="h-5 w-5 text-[#ff49b3]" />
            <div className="mt-2 text-[12px] font-black">Kindness reward</div>
            <div className="text-[10px] text-[#8194ba]">{rewardText}</div>
          </Glass>
        </div>

        <Glass className="mt-3 p-4">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-black">Challenge Rules</h2><span className="text-[10px] text-[#8da0c5]">4 simple steps</span></div>
          <div className="mt-4 space-y-4">
            {[
              ["1","Do the helpful action","Make the moment genuinely useful and respectful."],
              ["2","Capture proof only when appropriate","People may opt out of appearing on camera."],
              ["3","Share a kind caption","No shame, harassment, or dangerous dares."],
              ["4","Submit for verification","Rewards only unlock after the required validation."],
            ].map(([n,h,b]) => (
              <div key={n} className="grid grid-cols-[42px_1fr] gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#c445ff] to-[#4d75ff] font-black">{n}</span>
                <div><div className="text-[14px] font-bold">{h}</div><div className="mt-0.5 text-[11px] leading-5 text-[#91a2c4]">{b}</div></div>
              </div>
            ))}
          </div>
        </Glass>

        <Link to="/Dares" className="mt-4 block"><GradientButton className="w-full text-[17px]">✦ {selected ? "Open Challenge" : "Join / Create Challenge"} <ChevronRight className="ml-2 inline h-5 w-5" /></GradientButton></Link>
        <div className="mt-4 grid grid-cols-3 gap-2 pb-3 text-center text-[9px] text-[#8ca0c2]">
          <div><Users className="mx-auto mb-1 h-5 w-5 text-[#d35fff]" />Kinder community</div>
          <div><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-[#5fe0ff]" />Respect & safety</div>
          <div><Heart className="mx-auto mb-1 h-5 w-5 text-[#ff5ab9]" />Positive change</div>
        </div>
      </div>
    </BnmLockedScreen>
  );
}