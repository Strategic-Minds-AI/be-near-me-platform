import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmChevronRightIcon, BnmGiftIcon, BnmLeafSmallIcon, BnmLockIcon, BnmPackageIcon, BnmStarIcon } from "@/components/bnm/BnmIcons";
import { BnmLockedScreen, EmptyState, Glass, Pill, SectionTitle, asItems, formatCount } from "@/components/bnm/LockedShell";
import { BNM_REWARDS } from "@/lib/bnm/rewardCatalog";

function RewardVisual({ reward, large = false }) {
  return (
    <div className={
      "relative grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_72%_18%,rgba(255,68,177,.3),transparent_32%),radial-gradient(circle_at_24%_82%,rgba(51,197,255,.18),transparent_34%),linear-gradient(135deg,#18355a,#17152f_55%,#471844)] " +
      (large ? "h-[128px]" : "aspect-[1.04]")
    }>
      {reward.visual === "leaf" ? <BnmLeafSmallIcon size={large ? 56 : 44} /> : <BnmGiftIcon size={large ? 56 : 44} />}
      <div className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-black text-[#dbe7f8] backdrop-blur">
        {reward.internal ? "BE NEAR ME" : "PARTNER REQUIRED"}
      </div>
    </div>
  );
}

export default function BnmLockedRewards() {
  const [filter, setFilter] = useState("All");
  const { data: user } = useQuery({ queryKey:["currentUser"], queryFn:()=>base44.auth.me() });
  const { data: channels = [] } = useQuery({
    queryKey:["bnm-reward-channel-v2",user?.email],
    enabled:!!user?.email,
    queryFn:async()=>asItems(await base44.entities.Channel.filter({ created_by:user.email }, "-created_date", 1)),
  });

  const channel = channels[0] || null;
  const points = Number(channel?.credits || 0);
  const featured = BNM_REWARDS.slice(0, 3);

  const filtered = useMemo(() => {
    if (filter === "All") return BNM_REWARDS;
    if (filter === "Impact") return BNM_REWARDS.filter((reward) => reward.category === "Impact");
    if (filter === "Apparel") return BNM_REWARDS.filter((reward) => reward.category === "Apparel");
    return [];
  }, [filter]);

  return (
    <BnmLockedScreen rewards>
      <div className="px-3 pt-3">
        <Glass className="overflow-hidden p-4">
          <div className="grid grid-cols-[1fr_132px] gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.1em] text-[#82a6ff]">✦ Your Points</div>
              <div className="mt-1.5 flex items-center gap-2 text-[38px] font-black tracking-[-.04em]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f8a814] text-[14px] text-white shadow-[0_0_20px_rgba(248,168,20,.25)]">★</span>
                {formatCount(points)}
              </div>
              <p className="mt-1 max-w-[210px] text-[13px] leading-5 text-[#b8c7e4]">Turn real good deeds into verified rewards.</p>
              <Link to="/Wallet" className="mt-3 inline-flex rounded-full border border-[#5c6e9a] bg-[#142143] px-3 py-1.5 text-[9px] font-black">Reward History ›</Link>
            </div>
            <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#263976] via-[#351a63] to-[#0f263e]">
              <div className="absolute right-4 top-4"><BnmGiftIcon size={56} /></div>
              <div className="absolute bottom-3 left-3"><BnmLeafSmallIcon size={36} /></div>
              <div className="absolute bottom-4 right-5"><BnmStarIcon size={20} filled /></div>
            </div>
          </div>
        </Glass>

        <div className="mt-5"><SectionTitle title="Featured Rewards" action="See All" href="#all-rewards" /></div>
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {featured.map((reward) => (
            <Glass key={reward.id} className="w-[162px] shrink-0 overflow-hidden">
              <RewardVisual reward={reward} large />
              <div className="p-3">
                <div className="line-clamp-2 min-h-[34px] text-[12px] font-black leading-4">{reward.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <b className="text-[11px] text-[#ffd15d]">★ {formatCount(reward.points)}</b>
                  <span className="rounded-full border border-[#415a84] bg-[#10203d] px-2 py-1 text-[8px] font-black text-[#a8b7d1]">COMING SOON</span>
                </div>
              </div>
            </Glass>
          ))}
        </div>

        <div id="all-rewards" className="mt-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {["All","Apparel","Experiences","Gift Cards","Impact"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-[9px] font-black " +
                (filter === item
                  ? "border-[#f353e6] bg-[#261d4d] text-white shadow-[0_0_14px_rgba(202,74,255,.22)]"
                  : "border-[#35517c] bg-[#0a1832] text-[#aebddd]")
              }
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 pb-3">
          {filtered.map((reward) => (
            <Glass key={reward.id} className="overflow-hidden">
              <RewardVisual reward={reward} />
              <div className="p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Pill active={reward.internal}>{reward.internal ? "Featured" : "Impact"}</Pill>
                </div>
                <h3 className="text-[13px] font-black leading-4">{reward.name}</h3>
                <p className="mt-1 min-h-[32px] text-[9px] leading-4 text-[#9aaccc]">{reward.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-[#ffc14b]">★ {formatCount(reward.points)}</span>
                  {reward.redeemable ? (
                    <Link to={"/reward-checkout/" + reward.id} className="grid h-8 w-8 place-items-center rounded-full border border-[#6c5fbb] bg-[#151d42]"><BnmChevronRightIcon size={16} /></Link>
                    ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-[#485d83] bg-[#0d1930] text-[#8292af]"><BnmLockIcon size={16} /></span>
                  )}
                </div>
              </div>
            </Glass>
          ))}
        </div>

        {!filtered.length ? (
          <EmptyState icon={BnmPackageIcon} title={"No verified " + filter.toLowerCase() + " rewards yet"} body="This category stays empty until a real reward or partner is configured." />
        ) : null}

        {!channel ? <div className="mt-3"><EmptyState icon={BnmStarIcon} title="Sign in to see your points" body="Your balance comes from your real channel credit ledger." /></div> : null}

        <p className="mt-4 pb-4 text-center text-[9px] leading-4 text-[#7488aa]">
          The marketplace never invents stock, partner gift cards, or fulfillment. Physical and partner rewards unlock only after verified inventory/partner configuration.
        </p>
      </div>
    </BnmLockedScreen>
  );
}