import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmChevronRightIcon, BnmClockIcon, BnmHeartIcon, BnmLeafSmallIcon, BnmShieldIcon, BnmSparkleIcon, BnmUsersIcon } from "@/components/bnm/BnmIcons";
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
        <MediaBackdrop src={selected?.video_url} className="min-h-[268px] border border-[#263f68]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(255,74,176,.2),transparent_30%),linear-gradient(180deg,rgba(1,8,19,.05),rgba(2,8,18,.1)_35%,rgba(1,6,16,.92)_100%)]" />
          <div className="relative flex min-h-[268px] flex-col p-3">
            <div className="flex items-center justify-between">
              <Pill active><BnmLeafSmallIcon size={14} /> Kindness Challenge</Pill>
              <Pill>{status}</Pill>
            </div>
            <div className="mt-auto">
              <h1 className="max-w-[340px] text-[29px] font-black leading-[.96] tracking-[-.045em]">{title}</h1>
              <p className="mt-2 max-w-[345px] text-[10px] leading-4 text-[#dce6f6]">
                A small moment of kindness can make someone’s day. Keep it safe, respectful, and genuinely helpful.
              </p>
            </div>
          </div>
        </MediaBackdrop>

        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          <Glass className="p-2.5">
            <BnmClockIcon size={18} />
            <div className="mt-1.5 text-[16px] font-black">{days === "—" ? "—" : days + "d"}</div>
            <div className="text-[8px] leading-3 text-[#8497b9]">Time left</div>
          </Glass>
          <Glass className="p-2.5">
            <BnmUsersIcon size={18} />
            <div className="mt-1.5 text-[16px] font-black">—</div>
            <div className="text-[8px] leading-3 text-[#8497b9]">People joined</div>
          </Glass>
          <Glass className="p-2.5">
            <BnmHeartIcon size={18} filled />
            <div className="mt-1.5 text-[16px] font-black">{reward === null ? "—" : reward}</div>
            <div className="text-[8px] leading-3 text-[#8497b9]">Reward units</div>
          </Glass>
        </div>

        <Glass className="mt-1.5 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black">Challenge Rules</h2>
            <span className="text-[9px] font-bold text-[#8496b7]">4 simple steps</span>
          </div>
          <div className="mt-2.5 space-y-2">
            {[
              ["1","Hold the door open for someone","Choose a safe public setting and never pressure someone to be recorded."],
              ["2","Capture the moment only with consent","A proof clip can focus on you or the action without filming strangers."],
              ["3","Share a kind caption","Keep names, locations, and personal details private unless they are intentionally public."],
              ["4","Submit for verification","Rewards only unlock after the real challenge record meets its validation rules."],
            ].map(([n,h,b]) => (
              <div key={n} className="grid grid-cols-[31px_1fr] gap-2.5">
                <span className="grid h-7.5 w-7.5 place-items-center rounded-full bg-gradient-to-br from-[#c846ff] to-[#4b79ff] text-[11px] font-black shadow-[0_0_12px_rgba(120,75,255,.22)]">{n}</span>
                <div>
                  <div className="text-[10px] font-black leading-3.5">{h}</div>
                  <div className="mt-0.5 text-[8px] leading-3 text-[#8fa1c3]">{b}</div>
                </div>
              </div>
            ))}
          </div>
        </Glass>

        <Link to="/Dares" className="mt-2 block">
          <GradientButton className="w-full py-2.5 text-[13px]">
            <span className="mr-1 inline-flex align-middle"><BnmSparkleIcon size={18} /></span>
            {selected ? "Open Challenge" : "Join / Create Challenge"}
            <span className="ml-2 inline-flex align-middle"><BnmChevronRightIcon size={18} /></span>
          </GradientButton>
        </Link>

        <div className="mt-2 grid grid-cols-3 gap-2 pb-2 text-center text-[7px] leading-3 text-[#8295b8]">
          <div className="flex flex-col items-center"><BnmUsersIcon size={18} /><span className="mb-1">Kinder community</span></div>
          <div className="flex flex-col items-center"><BnmShieldIcon size={18} /><span className="mb-1">Safe and respectful</span></div>
          <div className="flex flex-col items-center"><BnmHeartIcon size={18} filled /><span className="mb-1">Positive action</span></div>
        </div>
        {isLoading ? <p className="sr-only">Loading challenges</p> : null}
      </div>
    </BnmLockedScreen>
  );
}