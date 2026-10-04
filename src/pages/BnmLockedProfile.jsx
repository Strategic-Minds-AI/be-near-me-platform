import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bnmData } from "@/services/bnmData";
import { Heart, Leaf, Play, Send, ShieldCheck, Users } from "lucide-react";
import {
  Avatar, BnmLockedScreen, EmptyState, GradientButton, Pill, asItems, formatCount
} from "@/components/bnm/LockedShell";

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return Boolean(video?.channel_id) && !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmLockedProfile() {
  const [params] = useSearchParams();
  const requestedChannelId = params.get("channel");

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => bnmData.auth.me() });

  const { data: myChannels = [] } = useQuery({
    queryKey: ["bnm-profile-my-channel", user?.email],
    enabled: !!user?.email && !requestedChannelId,
    queryFn: async () => asItems(await bnmData.entities.Channel.filter({ created_by: user.email }, "-created_date", 1)),
  });

  const myChannel = myChannels[0] || null;
  const channelId = requestedChannelId || myChannel?.id || null;

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnm-profile-public-videos-v2", channelId],
    enabled: !!channelId,
    queryFn: async () => {
      const rows = asItems(await bnmData.entities.Video.filter({ channel_id: channelId, visibility: "public" }, "-created_date", 30));
      return rows.filter(isProductionContent);
    },
  });

  const { data: reps = [] } = useQuery({
    queryKey: ["bnm-profile-reputation-v2", channelId],
    enabled: !!channelId,
    queryFn: async () => asItems(await bnmData.entities.CreatorReputation.filter({ channel_id: channelId }, "-created_date", 1)),
  });

  const rep = reps[0] || null;
  const publicMode = Boolean(requestedChannelId && requestedChannelId !== myChannel?.id);
  const latest = videos[0] || null;
  const name = publicMode ? (latest?.channel_name || "Creator") : (myChannel?.name || latest?.channel_name || "");
  const handle = publicMode ? "" : (myChannel?.handle || "");
  const avatar = publicMode ? latest?.channel_avatar : (myChannel?.avatar_url || latest?.channel_avatar);
  const banner = publicMode ? (latest?.poster_url || latest?.thumbnail_url) : (myChannel?.banner_url || latest?.poster_url || latest?.thumbnail_url);
  const totalViews = videos.reduce((sum, row) => sum + Number(row.views || 0), 0);
  const totalLikes = videos.reduce((sum, row) => sum + Number(row.likes || 0), 0);
  const followers = publicMode ? null : Number(myChannel?.subscribers_count || 0);

  if (!channelId && !isLoading) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="relative h-[184px] overflow-hidden bg-[radial-gradient(circle_at_70%_20%,rgba(166,72,255,.25),transparent_30%),linear-gradient(135deg,#153d67,#172447_55%,#3f183f)]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#020b19] via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[9px] font-black text-[#9fb0cf] backdrop-blur">NEW CREATOR</div>
        </div>

        <div className="-mt-12 px-3">
          <div className="relative z-10 flex items-end justify-between gap-3">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#30c8ff] via-[#9650ff] to-[#ff3aa9] p-[2px] shadow-[0_0_22px_rgba(140,75,255,.28)]">
              <div className="grid h-full w-full place-items-center rounded-full bg-[#0a1730]">
                <Users className="h-8 w-8 text-[#8068cf]" />
              </div>
            </div>
            <Link to="/create-channel"><GradientButton className="mb-1 px-6 py-2.5">Create Channel</GradientButton></Link>
          </div>

          <h1 className="mt-3 text-[27px] font-black leading-none tracking-[-.04em]">Your creator profile</h1>
          <div className="mt-1 text-[10px] text-[#9cadce]">Set up your channel to publish and track real impact.</div>

          <div className="mt-4 grid grid-cols-4 divide-x divide-[#2a3d61] text-center">
            <div><b className="block text-[18px]">0</b><span className="text-[9px] text-[#8fa0c2]">Posts</span></div>
            <div><b className="block text-[18px]">0</b><span className="text-[9px] text-[#8fa0c2]">Followers</span></div>
            <div><b className="block text-[18px]">0</b><span className="text-[9px] text-[#8fa0c2]">Views</span></div>
            <div><b className="block text-[18px]">—</b><span className="text-[9px] text-[#8fa0c2]">Impact</span></div>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <Pill><Leaf className="h-3 w-3" /> Community Creator</Pill>
            <Pill>Profile setup required</Pill>
          </div>

          <div className="mt-4 grid grid-cols-4 border-b border-[#233858] pb-2 text-center text-[10px] font-black text-[#96a7c7]">
            <span className="text-white">▦ Posts</span><span>▷ Reels</span><span>♧ Impact</span><span>♙ Tagged</span>
          </div>

          <div className="mt-1 grid grid-cols-3 gap-1 pb-4">
            {[1,2,3,4,5,6,7,8,9].map((i) => (
              <div key={i} className="relative aspect-[.82] overflow-hidden rounded-[7px] border border-[#1d3457] bg-[linear-gradient(135deg,#0b1930,#10172c_55%,#23132b)]">
                <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-[#162741]" />
                <div className="absolute inset-x-5 bottom-4 h-2 rounded-full bg-[#13213a]" />
              </div>
            ))}
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="relative h-[184px] overflow-hidden bg-gradient-to-br from-[#1d4a78] via-[#17254a] to-[#4d1748]">
        {banner ? <img src={banner} alt="" className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020b19] via-black/5 to-black/10" />
        <div className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[9px] font-black backdrop-blur">
          {publicMode ? "Public creator" : "Your profile"}
        </div>
      </div>

      <div className="-mt-12 px-3">
        <div className="relative z-10 flex items-end justify-between gap-3">
          <Avatar src={avatar} label={name || "BN"} size={96} />
          {publicMode ? (
            <div className="mb-1 flex gap-2">
              <button className="grid h-10 w-10 place-items-center rounded-full border border-[#46618e] bg-[#0d1b35]"><Send className="h-4.5 w-4.5" /></button>
              <GradientButton className="px-6 py-2.5">+ Follow</GradientButton>
            </div>
          ) : (
            <Link to="/settings"><GradientButton className="mb-1 px-6 py-2.5">Edit Profile</GradientButton></Link>
          )}
        </div>

        <h1 className="mt-3 text-[27px] font-black leading-none tracking-[-.04em]">{name || "Creator"}</h1>
        <div className="mt-1 text-[10px] text-[#9cadce]">
          {handle ? "@" + handle : "Be Near Me creator"}{myChannel?.country && !publicMode ? " • " + myChannel.country : ""}
        </div>

        {!publicMode && myChannel?.description ? (
          <p className="mt-3 text-[12px] leading-5 text-[#d9e2f3]">{myChannel.description}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-4 divide-x divide-[#2a3d61] text-center">
          <div><b className="block text-[18px]">{formatCount(videos.length)}</b><span className="text-[9px] text-[#8fa0c2]">Posts</span></div>
          <div><b className="block text-[18px]">{followers === null ? "—" : formatCount(followers)}</b><span className="text-[9px] text-[#8fa0c2]">Followers</span></div>
          <div><b className="block text-[18px]">{formatCount(totalViews)}</b><span className="text-[9px] text-[#8fa0c2]">Views</span></div>
          <div><b className="block text-[18px]">{rep?.score ?? "—"}</b><span className="text-[9px] text-[#8fa0c2]">Impact</span></div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <Pill><Leaf className="h-3 w-3" /> Community Creator</Pill>
          {rep?.level ? <Pill><ShieldCheck className="h-3 w-3" /> {rep.level}</Pill> : null}
          <Pill><Heart className="h-3 w-3" /> {formatCount(totalLikes)} likes</Pill>
        </div>

        <div className="mt-4 grid grid-cols-4 border-b border-[#233858] pb-2 text-center text-[10px] font-black text-[#96a7c7]">
          <span className="text-white">▦ Posts</span><span>▷ Reels</span><span>♧ Impact</span><span>♙ Tagged</span>
        </div>

        {isLoading ? (
          <div className="mt-2 grid grid-cols-3 gap-1">{[1,2,3,4,5,6].map((i)=><div key={i} className="aspect-[.82] animate-pulse rounded-[7px] bg-[#0d1b32]" />)}</div>
        ) : videos.length ? (
          <div className="mt-1 grid grid-cols-3 gap-1 pb-4">
            {videos.slice(0, 15).map((v) => (
              <div key={v.id} className="relative aspect-[.82] overflow-hidden rounded-[7px] bg-[#0d1b32]">
                {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-7 w-7 text-[#8d6cff]" /></div>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 text-[8px] font-black">▶ {formatCount(v.views)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4"><EmptyState icon={Play} title="No verified public posts yet" body="This profile does not display seed or scraped donor content." /></div>
        )}
      </div>
    </BnmLockedScreen>
  );
}
