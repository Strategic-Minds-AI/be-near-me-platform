import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Leaf, Play, ShieldCheck, Users } from "lucide-react";
import { Avatar, BnmLockedScreen, EmptyState, GradientButton, Pill, asItems, formatCount } from "@/components/bnm/LockedShell";

export default function BnmLockedProfile() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-profile-channel", user?.email],
    enabled: !!user?.email,
    queryFn: async () => asItems(await base44.entities.Channel.filter({ created_by: user.email }, "-created_date", 1)),
  });
  const channel = channels[0];
  const { data: videos = [] } = useQuery({
    queryKey: ["bnm-profile-videos", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await base44.entities.Video.filter({ channel_id: channel.id }, "-created_date", 24)),
  });
  const { data: reps = [] } = useQuery({
    queryKey: ["bnm-profile-reputation", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await base44.entities.CreatorReputation.filter({ channel_id: channel.id }, "-created_date", 1)),
  });
  const rep = reps[0];

  if (!channel) return <BnmLockedScreen><div className="pt-6"><EmptyState icon={Users} title="Create your creator profile" body="Your profile will appear here after a channel is created." /><div className="px-4 pt-3"><Link to="/CreateChannel"><GradientButton className="w-full">Create Channel</GradientButton></Link></div></div></BnmLockedScreen>;

  return (
    <BnmLockedScreen>
      <div className="relative h-[190px] overflow-hidden bg-gradient-to-br from-[#1e4d7e] via-[#16244a] to-[#4b1848]">
        {channel.banner_url ? <img src={channel.banner_url} alt="" className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020b19] via-transparent to-transparent" />
      </div>
      <div className="-mt-14 px-3">
        <div className="relative z-10 flex items-end justify-between">
          <Avatar src={channel.avatar_url} label={channel.name} size={104} />
          <Link to="/Settings"><GradientButton className="mb-2 px-7 py-2.5">Edit Profile</GradientButton></Link>
        </div>
        <h1 className="mt-3 text-[28px] font-black tracking-[-.04em]">{channel.name}</h1>
        <div className="text-[12px] text-[#9cadce]">@{channel.handle}{channel.country ? " • " + channel.country : ""}</div>
        {channel.description ? <p className="mt-3 text-[13px] leading-5 text-[#d9e2f3]">{channel.description}</p> : null}

        <div className="mt-5 grid grid-cols-4 divide-x divide-[#2a3d61] text-center">
          <div><b className="block text-[20px]">{formatCount(videos.length)}</b><span className="text-[10px] text-[#8fa0c2]">Posts</span></div>
          <div><b className="block text-[20px]">{formatCount(channel.subscribers_count)}</b><span className="text-[10px] text-[#8fa0c2]">Followers</span></div>
          <div><b className="block text-[20px]">{formatCount(channel.total_views)}</b><span className="text-[10px] text-[#8fa0c2]">Views</span></div>
          <div><b className="block text-[20px]">{rep?.score ?? "—"}</b><span className="text-[10px] text-[#8fa0c2]">Impact</span></div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none]"><Pill><Leaf className="h-3 w-3"/> Community Creator</Pill>{rep?.level ? <Pill><ShieldCheck className="h-3 w-3"/>{rep.level}</Pill> : null}</div>
        <div className="mt-5 grid grid-cols-4 border-b border-[#233858] pb-2 text-center text-[11px] font-bold text-[#96a7c7]"><span className="text-white">▦ Posts</span><span>▷ Reels</span><span>♧ Impact</span><span>♙ Tagged</span></div>

        {videos.length ? (
          <div className="mt-2 grid grid-cols-3 gap-1 pb-4">
            {videos.slice(0,12).map((v) => (
              <div key={v.id} className="relative aspect-[.82] overflow-hidden rounded-[8px] bg-[#0d1b32]">
                {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><Play className="h-7 w-7 text-[#8d6cff]"/></div>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[9px] font-black">▶ {formatCount(v.views)}</div>
              </div>
            ))}
          </div>
        ) : <div className="mt-4"><EmptyState icon={Play} title="No posts yet" body="Your published videos will appear in this locked profile grid." /></div>}
      </div>
    </BnmLockedScreen>
  );
}