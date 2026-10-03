import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, CalendarDays, Eye, Heart, MessageCircle, Play, Plus, Sparkles, Users } from "lucide-react";
import { Avatar, BnmLockedScreen, EmptyState, Glass, GradientButton, Metric, SectionTitle, asItems, formatCount } from "@/components/bnm/LockedShell";

export default function BnmLockedCreatorStudio() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-studio-channel", user?.email],
    enabled: !!user?.email,
    queryFn: async () => asItems(await base44.entities.Channel.filter({ created_by: user.email }, "-created_date", 1)),
  });
  const channel = channels[0];
  const { data: videos = [] } = useQuery({
    queryKey: ["bnm-studio-videos", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await base44.entities.Video.filter({ channel_id: channel.id }, "-created_date", 50)),
  });
  const { data: earnings = [] } = useQuery({
    queryKey: ["bnm-studio-earnings", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await base44.entities.CreatorEarning.filter({ channel_id: channel.id }, "-created_date", 200)),
  });

  if (!channel) return <BnmLockedScreen><div className="pt-6"><EmptyState icon={Sparkles} title="Creator Studio unlocks with a channel" body="Create a channel first. Studio metrics never use fabricated activity." /><div className="px-4 pt-3"><Link to="/CreateChannel"><GradientButton className="w-full">Create Channel</GradientButton></Link></div></div></BnmLockedScreen>;

  const likes = videos.reduce((sum, v) => sum + Number(v.likes || 0), 0);
  const comments = videos.reduce((sum, v) => sum + Number(v.comments_count || 0), 0);
  const totalEarned = earnings.reduce((sum, item) => sum + Number(item.amount_cents || item.amount || 0), 0);
  const recent = videos[0];
  const maxViews = Math.max(1, ...videos.slice(0,8).map((v)=>Number(v.views || 0)));

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-[28px] font-black tracking-[-.04em]">Creator Studio</h1><p className="text-sm text-[#9aadd0]">Create a kinder, brighter world.</p></div>
          <Link to="/profile" className="rounded-full border border-[#526ba0] bg-[#102044] px-4 py-2 text-xs font-black">View Profile ›</Link>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar src={channel.avatar_url} label={channel.name} size={70} />
          <div className="min-w-0 flex-1"><div className="truncate text-[20px] font-black">{channel.name}</div><div className="text-xs text-[#96a8ca]">@{channel.handle}</div></div>
          <Glass className="px-3 py-2 text-right"><div className="text-[10px] text-[#9f81ff]">CREATOR</div><div className="text-[11px] font-black">{formatCount(channel.subscribers_count)} followers</div></Glass>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <Metric icon={Eye} value={formatCount(channel.total_views)} label="Views" accent="text-[#a47cff]" />
          <Metric icon={Heart} value={formatCount(likes)} label="Likes" accent="text-[#ff4eaf]" />
          <Metric icon={MessageCircle} value={formatCount(comments)} label="Comments" accent="text-[#43c8ff]" />
          <Metric icon={Play} value={formatCount(videos.length)} label="Posts" accent="text-[#6b9cff]" />
        </div>

        <Glass className="mt-4 p-3">
          <SectionTitle title="Recent Post Performance" action={recent ? "See All" : null} href="/profile" />
          {recent ? <div className="flex gap-3"><div className="h-[120px] w-[145px] shrink-0 overflow-hidden rounded-[14px] bg-[#13213a]">{recent.thumbnail_url ? <img src={recent.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-8 w-8 text-[#956dff]" /></div>}</div><div className="min-w-0 flex-1"><div className="line-clamp-2 text-[15px] font-black">{recent.title}</div><div className="mt-1 text-[10px] text-[#96a8c7]">{formatCount(recent.views)} views</div><div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[#b8c5df]"><span>♥ {formatCount(recent.likes)}</span><span>◯ {formatCount(recent.comments_count)}</span></div></div></div> : <p className="text-xs text-[#8ea0c0]">No published post yet.</p>}
        </Glass>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Glass className="p-3"><div className="flex items-center justify-between"><b className="text-[13px]">Audience Activity</b><BarChart3 className="h-4 w-4 text-[#955cff]" /></div><div className="mt-4 flex h-24 items-end gap-1">{videos.slice(0,8).map((v)=><span key={v.id} className="flex-1 rounded-t bg-gradient-to-t from-[#585cff] to-[#f14fff]" style={{height: Math.max(8, Math.round((Number(v.views || 0)/maxViews)*100)) + "%"}} />)}{!videos.length ? <span className="text-[10px] text-[#8396b8]">No real history yet</span> : null}</div></Glass>
          <Glass className="p-3"><div className="text-[13px] font-black">Platform Earnings</div><div className="mt-4 text-[25px] font-black">{totalEarned ? "$" + (totalEarned/100).toFixed(2) : "—"}</div><div className="text-[10px] leading-4 text-[#8497b8]">{totalEarned ? "Recorded creator earnings" : "No recorded earnings. No synthetic revenue."}</div></Glass>
        </div>

        <Glass className="mt-3 p-3">
          <div className="text-[14px] font-black">Quick Actions</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link to="/create" className="rounded-[14px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><Plus className="mx-auto h-6 w-6 text-[#ff53b6]"/><b className="mt-2 block text-[11px]">Create</b></Link>
            <Link to="/StudioContent" className="rounded-[14px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><CalendarDays className="mx-auto h-6 w-6 text-[#77a4ff]"/><b className="mt-2 block text-[11px]">Schedule</b></Link>
            <Link to="/Community" className="rounded-[14px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><Users className="mx-auto h-6 w-6 text-[#9c83ff]"/><b className="mt-2 block text-[11px]">Collaborate</b></Link>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}