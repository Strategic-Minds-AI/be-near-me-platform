import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bnmData } from "@/services/bnmData";
import {
  BarChart3, CalendarDays, Eye, Heart, Leaf, MessageCircle, Play, Plus, Sparkles, Trophy, Users
} from "lucide-react";
import {
  Avatar, BnmLockedScreen, Glass, GradientButton, Metric, Pill, SectionTitle, asItems, formatCount
} from "@/components/bnm/LockedShell";

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return Boolean(video?.channel_id) && !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmLockedCreatorStudio() {
  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => bnmData.auth.me() });
  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-studio-channel-v2", user?.email],
    enabled: !!user?.email,
    queryFn: async () => asItems(await bnmData.entities.Channel.filter({ created_by: user.email }, "-created_date", 1)),
  });
  const channel = channels[0] || null;

  const { data: rawVideos = [] } = useQuery({
    queryKey: ["bnm-studio-videos-v2", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await bnmData.entities.Video.filter({ channel_id: channel.id }, "-created_date", 50)),
  });
  const videos = rawVideos.filter(isProductionContent);

  const { data: earnings = [] } = useQuery({
    queryKey: ["bnm-studio-earnings-v2", channel?.id],
    enabled: !!channel?.id,
    queryFn: async () => asItems(await bnmData.entities.CreatorEarning.filter({ channel_id: channel.id }, "-created_date", 200)),
  });

  if (!channel) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-black leading-none tracking-[-.04em]">Creator Studio</h1>
              <p className="mt-1 text-[11px] text-[#9aadd0]">Create a kinder, brighter world.</p>
            </div>
            <Link to="/profile" className="rounded-full border border-[#526ba0] bg-[#102044] px-3.5 py-2 text-[9px] font-black">View Profile ›</Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#30c8ff] via-[#9650ff] to-[#ff3aa9] p-[2px]">
              <div className="grid h-full w-full place-items-center rounded-full bg-[#0a1730]"><Sparkles className="h-6 w-6 text-[#9c83ff]" /></div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-black">Creator channel not set up</div>
              <div className="mt-0.5 text-[9px] text-[#96a8ca]">Create a channel to unlock live analytics.</div>
              <div className="mt-1.5"><Pill><Leaf className="h-3 w-3" /> Kindness Creator</Pill></div>
            </div>
            <Link to="/CreateChannel"><GradientButton className="px-3 py-2 text-[9px]">Create</GradientButton></Link>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <Metric icon={Eye} value="—" label="Views" accent="text-[#9f7aff]" />
            <Metric icon={Heart} value="—" label="Likes" accent="text-[#ff4eaf]" />
            <Metric icon={MessageCircle} value="—" label="Comments" accent="text-[#43c8ff]" />
            <Metric icon={Play} value="0" label="Posts" accent="text-[#6b9cff]" />
          </div>

          <Glass className="mt-3 p-3">
            <SectionTitle title="Recent Post Performance" />
            <div className="flex gap-3">
              <div className="grid h-[105px] w-[132px] shrink-0 place-items-center rounded-[13px] border border-[#263f67] bg-[linear-gradient(135deg,#0e213f,#17172e_55%,#29152f)]">
                <Play className="h-7 w-7 text-[#6e5db8]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-3 w-[86%] rounded-full bg-[#1a2b47]" />
                <div className="mt-2 h-2.5 w-[64%] rounded-full bg-[#14243e]" />
                <div className="mt-4 grid grid-cols-2 gap-2 text-[9px] text-[#899bbb]">
                  <span>♥ —</span><span>◯ —</span><span>▷ —</span><span>Impact —</span>
                </div>
                <p className="mt-2 text-[8px] leading-3 text-[#7f92b6]">Real post analytics appear here after publishing.</p>
              </div>
            </div>
          </Glass>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Glass className="p-3">
              <div className="flex items-center justify-between"><b className="text-[11px]">Audience Activity</b><BarChart3 className="h-4 w-4 text-[#955cff]" /></div>
              <div className="mt-3 grid h-20 grid-cols-8 items-end gap-1">
                {[22,34,28,44,38,54,42,66].map((h,i)=><span key={i} className="rounded-t bg-[#172a48]" style={{height:h+"%"}} />)}
              </div>
              <div className="mt-1 text-[8px] text-[#788bac]">Placeholder geometry only</div>
            </Glass>

            <Glass className="p-3">
              <div className="flex items-center justify-between"><b className="text-[11px]">Creator Rewards</b><Trophy className="h-4 w-4 text-[#ffbd4b]" /></div>
              <div className="mt-3 text-[23px] font-black text-[#ffd15d]">★ 0</div>
              <div className="mt-1 text-[9px] text-[#8fa1c1]">Kindness points</div>
              <div className="mt-2 text-[9px] text-[#8fa1c1]">No recorded cash earnings</div>
            </Glass>
          </div>

          <Glass className="mt-3 p-3">
            <div className="text-[11px] font-black">Top Community Categories</div>
            <div className="mt-3 space-y-2">
              {["Category","Category","Category"].map((label,i)=>(
                <div key={i} className="grid grid-cols-[70px_1fr_22px] items-center gap-2 text-[8px] text-[#8092b5]">
                  <span>{label}</span>
                  <span className="h-2 rounded-full bg-[#162741]" />
                  <span>—</span>
                </div>
              ))}
            </div>
          </Glass>

          <Glass className="mt-3 p-3">
            <div className="text-[11px] font-black">Quick Actions</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link to="/CreateChannel" className="rounded-[13px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><Plus className="mx-auto h-5 w-5 text-[#ff53b6]"/><b className="mt-2 block text-[9px]">Create Channel</b></Link>
              <div className="rounded-[13px] border border-[#2d4164] bg-[#0c1930] p-3 text-center opacity-60"><CalendarDays className="mx-auto h-5 w-5 text-[#77a4ff]"/><b className="mt-2 block text-[9px]">Schedule</b></div>
              <div className="rounded-[13px] border border-[#2d4164] bg-[#0c1930] p-3 text-center opacity-60"><Users className="mx-auto h-5 w-5 text-[#9c83ff]"/><b className="mt-2 block text-[9px]">Collaborate</b></div>
            </div>
          </Glass>
        </div>
      </BnmLockedScreen>
    );
  }

  const likes = videos.reduce((sum, v) => sum + Number(v.likes || 0), 0);
  const comments = videos.reduce((sum, v) => sum + Number(v.comments_count || 0), 0);
  const totalViews = videos.reduce((sum, v) => sum + Number(v.views || 0), 0);
  const totalEarned = earnings.reduce((sum, item) => sum + Number(item.amount_cents || item.amount || 0), 0);
  const recent = videos[0] || null;
  const maxViews = Math.max(1, ...videos.slice(0,8).map((v) => Number(v.views || 0)));

  const categoryCounts = new Map();
  videos.forEach((video) => {
    const key = video.category || "other";
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  });
  const categories = [...categoryCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const maxCategory = Math.max(1, ...categories.map(([,count])=>count));

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-black leading-none tracking-[-.04em]">Creator Studio</h1>
            <p className="mt-1 text-[11px] text-[#9aadd0]">Create a kinder, brighter world.</p>
          </div>
          <Link to="/profile" className="rounded-full border border-[#526ba0] bg-[#102044] px-3.5 py-2 text-[9px] font-black">View Profile ›</Link>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar src={channel.avatar_url} label={channel.name} size={62} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-black">{channel.name}</div>
            <div className="mt-0.5 text-[9px] text-[#96a8ca]">@{channel.handle}</div>
            <div className="mt-1.5"><Pill><Leaf className="h-3 w-3" /> Kindness Creator</Pill></div>
          </div>
          <Glass className="px-3 py-2 text-right">
            <div className="text-[8px] font-black uppercase tracking-[.08em] text-[#b98bff]">Followers</div>
            <div className="text-[12px] font-black">{formatCount(channel.subscribers_count)}</div>
          </Glass>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <Metric icon={Eye} value={formatCount(totalViews)} label="Views" accent="text-[#9f7aff]" />
          <Metric icon={Heart} value={formatCount(likes)} label="Likes" accent="text-[#ff4eaf]" />
          <Metric icon={MessageCircle} value={formatCount(comments)} label="Comments" accent="text-[#43c8ff]" />
          <Metric icon={Play} value={formatCount(videos.length)} label="Posts" accent="text-[#6b9cff]" />
        </div>

        <Glass className="mt-3 p-3">
          <SectionTitle title="Recent Post Performance" action={recent ? "See All" : null} href="/profile" />
          {recent ? (
            <div className="flex gap-3">
              <div className="relative h-[105px] w-[132px] shrink-0 overflow-hidden rounded-[13px] bg-[#13213a]">
                {recent.thumbnail_url ? <img src={recent.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-7 w-7 text-[#956dff]" /></div>}
                <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-black">{formatCount(recent.views)} views</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[12px] font-black leading-4">{recent.title}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-[#b8c5df]">
                  <span>♥ {formatCount(recent.likes)}</span><span>◯ {formatCount(recent.comments_count)}</span>
                  <span>▷ {formatCount(recent.views)}</span><span>Impact —</span>
                </div>
                <p className="mt-2 text-[8px] leading-3 text-[#7f92b6]">Only recorded metrics are shown. No synthetic retention or earnings.</p>
              </div>
            </div>
          ) : (
            <p className="py-5 text-center text-[10px] text-[#8ea0c0]">No verified public post yet.</p>
          )}
        </Glass>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Glass className="p-3">
            <div className="flex items-center justify-between"><b className="text-[11px]">Audience Activity</b><BarChart3 className="h-4 w-4 text-[#955cff]" /></div>
            <div className="mt-3 flex h-20 items-end gap-1">
              {videos.slice(0,8).map((v)=><span key={v.id} className="flex-1 rounded-t bg-gradient-to-t from-[#555dff] to-[#ec4dff]" style={{height: Math.max(8, Math.round((Number(v.views || 0)/maxViews)*100)) + "%"}} />)}
              {!videos.length ? <span className="self-center text-[9px] text-[#8396b8]">No real history</span> : null}
            </div>
          </Glass>

          <Glass className="p-3">
            <div className="flex items-center justify-between"><b className="text-[11px]">Creator Rewards</b><Trophy className="h-4 w-4 text-[#ffbd4b]" /></div>
            <div className="mt-3 text-[23px] font-black text-[#ffd15d]">★ {formatCount(channel.credits || 0)}</div>
            <div className="mt-1 text-[9px] text-[#8fa1c1]">Kindness points</div>
            <div className="mt-2 text-[9px] text-[#8fa1c1]">{totalEarned ? "Recorded creator earnings: $" + (totalEarned/100).toFixed(2) : "No recorded cash earnings"}</div>
          </Glass>
        </div>

        <Glass className="mt-3 p-3">
          <div className="text-[11px] font-black">Top Community Categories</div>
          {categories.length ? (
            <div className="mt-3 space-y-2">
              {categories.map(([category,count]) => (
                <div key={category} className="grid grid-cols-[78px_1fr_28px] items-center gap-2 text-[9px]">
                  <span className="truncate capitalize text-[#aebbd3]">{category}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#172743]"><span className="block h-full rounded-full bg-gradient-to-r from-[#4ecbff] via-[#755dff] to-[#f14cff]" style={{width: Math.round((count/maxCategory)*100) + "%"}} /></span>
                  <b className="text-right">{count}</b>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-[9px] text-[#8396b8]">No category history yet.</p>}
        </Glass>

        <Glass className="mt-3 p-3">
          <div className="text-[11px] font-black">Quick Actions</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link to="/create" className="rounded-[13px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><Plus className="mx-auto h-5 w-5 text-[#ff53b6]"/><b className="mt-2 block text-[9px]">Create</b></Link>
            <Link to="/StudioContent" className="rounded-[13px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><CalendarDays className="mx-auto h-5 w-5 text-[#77a4ff]"/><b className="mt-2 block text-[9px]">Schedule</b></Link>
            <Link to="/Community" className="rounded-[13px] border border-[#3a4e79] bg-[#101e3b] p-3 text-center"><Users className="mx-auto h-5 w-5 text-[#9c83ff]"/><b className="mt-2 block text-[9px]">Collaborate</b></Link>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
