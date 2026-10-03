import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Gift, Leaf, LockKeyhole, Star } from "lucide-react";
import { BnmLockedScreen, EmptyState, Glass, Pill, SectionTitle, asItems, formatCount } from "@/components/bnm/LockedShell";
import { BNM_REWARDS } from "@/lib/bnm/rewardCatalog";

function RewardVisual({ reward }) {
  const icon = reward.visual === "leaf" ? <Leaf className="h-12 w-12 text-[#67f0b0]" /> : <Gift className="h-12 w-12 text-[#ff60bd]" />;
  return <div className="grid aspect-[1.05] place-items-center bg-[radial-gradient(circle_at_70%_20%,rgba(255,68,177,.3),transparent_32%),linear-gradient(135deg,#18355a,#17152f_55%,#471844)]">{icon}</div>;
}

export default function BnmLockedRewards() {
  const { data: user } = useQuery({ queryKey:["currentUser"], queryFn:()=>base44.auth.me() });
  const { data: channels = [] } = useQuery({
    queryKey:["bnm-reward-channel",user?.email],
    enabled:!!user?.email,
    queryFn:async()=>asItems(await base44.entities.Channel.filter({ created_by:user.email }, "-created_date", 1)),
  });
  const channel = channels[0];
  const points = Number(channel?.credits || 0);

  return (
    <BnmLockedScreen rewards>
      <div className="px-3 pt-3">
        <Glass className="overflow-hidden p-5">
          <div className="grid grid-cols-[1fr_145px] gap-3">
            <div><div className="text-[11px] font-black uppercase tracking-[.08em] text-[#82a6ff]">✦ Your Points</div><div className="mt-2 flex items-center gap-2 text-[40px] font-black"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffab13] text-[16px] text-white">★</span>{formatCount(points)}</div><p className="mt-1 text-[16px] leading-6 text-[#b8c7e4]">Turn good deeds into good things.</p></div>
            <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#263976] via-[#351a63] to-[#0f263e]"><Gift className="absolute right-5 top-5 h-16 w-16 text-[#ff49b5]"/><Leaf className="absolute bottom-4 left-4 h-10 w-10 text-[#61e7b0]"/></div>
          </div>
        </Glass>

        <div className="mt-5"><SectionTitle title="Featured Rewards" /></div>
        <div className="grid grid-cols-2 gap-3">
          {BNM_REWARDS.map((reward)=>(
            <Glass key={reward.id} className="overflow-hidden">
              <RewardVisual reward={reward} />
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2"><Pill active={reward.internal}>{reward.internal ? "Be Near Me" : "Verified partner required"}</Pill></div>
                <h3 className="text-[15px] font-black leading-5">{reward.name}</h3>
                <p className="mt-1 min-h-[32px] text-[10px] leading-4 text-[#9aaccc]">{reward.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-[#ffc14b]">★ {formatCount(reward.points)}</span>
                  {reward.requires_verified_partner ? <span className="grid h-8 w-8 place-items-center rounded-full border border-[#485d83] text-[#8292af]"><LockKeyhole className="h-4 w-4"/></span> : <Link to={"/reward-checkout/" + reward.id} className="grid h-8 w-8 place-items-center rounded-full border border-[#6c5fbb] bg-[#151d42]"><ChevronRight className="h-4 w-4"/></Link>}
                </div>
              </div>
            </Glass>
          ))}
        </div>

        {!channel ? <div className="mt-4"><EmptyState icon={Star} title="Sign in to use points" body="Your reward balance comes from your real channel credit ledger." /></div> : null}
        <p className="mt-4 pb-4 text-center text-[10px] leading-4 text-[#7488aa]">Partner rewards remain locked until a real partner agreement and catalog configuration exist. Kindness points are separate from cash payments.</p>
      </div>
    </BnmLockedScreen>
  );
}