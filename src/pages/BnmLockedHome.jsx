import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bookmark, Heart, Leaf, MessageCircle, Play, Share2, ChevronRight } from "lucide-react";
import { Avatar, BnmLockedScreen, EmptyState, Glass, MediaBackdrop, Pill, asItems, formatCount } from "@/components/bnm/LockedShell";

export default function BnmLockedHome() {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnm-lock-public-videos"],
    queryFn: async () => asItems(await base44.entities.Video.filter({ visibility: "public" }, "-created_date", 30)),
  });
  const video = videos[0];

  return (
    <BnmLockedScreen>
      <div className="px-2 pt-1">
        {isLoading ? (
          <div className="h-[calc(100dvh-185px)] animate-pulse rounded-[22px] bg-[#0c1930]" />
        ) : !video ? (
          <EmptyState title="Your local feed starts here" body="Public community moments will appear here when creators share them." icon={Heart} />
        ) : (
          <MediaBackdrop src={video.poster_url || video.thumbnail_url} className="min-h-[calc(100dvh-186px)]">
            {video.url && !video.thumbnail_url ? <video src={video.url} muted playsInline className="absolute inset-0 h-full w-full object-cover" /> : null}
            <div className="flex min-h-[calc(100dvh-186px)] flex-col justify-end px-3 pb-5 pt-20">
              <div className="mb-auto flex items-center justify-between gap-3">
                <Glass className="rounded-full px-3 py-2"><span className="text-[11px] font-bold text-[#d4def6]">Local community feed</span></Glass>
                <Glass className="flex items-center gap-2 rounded-full px-3 py-2"><Play className="h-3.5 w-3.5 text-[#ff45b5]" fill="currentColor" /><span className="text-[11px] font-black">{formatCount(video.views)} views</span></Glass>
              </div>
              <div className="grid grid-cols-[1fr_54px] gap-2">
                <div className="self-end">
                  <Link to="/challenge" className="mb-3 inline-flex"><Pill active><Leaf className="h-3.5 w-3.5" /> Kindness Challenge <ChevronRight className="h-3 w-3" /></Pill></Link>
                  <div className="flex items-center gap-2">
                    <Avatar src={video.channel_avatar} label={video.channel_name || "BN"} size={42} />
                    <div><div className="text-[16px] font-black">{video.channel_name || "Be Near Me Creator"}</div><div className="text-[10px] text-[#a8b6d2]">Community creator</div></div>
                  </div>
                  <h1 className="mt-3 text-[16px] font-bold leading-snug">{video.title}</h1>
                  {video.description ? <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-[#e0e8f8]">{video.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">{(video.tags || []).slice(0,4).map((tag) => <Pill key={tag}>#{String(tag).replace(/^#/, "")}</Pill>)}</div>
                </div>
                <div className="flex flex-col items-center justify-end gap-4 pb-1">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ff37aa] text-white shadow-[0_0_20px_rgba(255,55,170,.35)]"><Heart className="h-6 w-6" fill="white" /></div>
                  <span className="-mt-3 text-[10px] font-black">{formatCount(video.likes)}</span>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur"><MessageCircle className="h-6 w-6" /></div>
                  <span className="-mt-3 text-[10px] font-black">{formatCount(video.comments_count)}</span>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur"><Bookmark className="h-6 w-6" /></div>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur"><Share2 className="h-6 w-6" /></div>
                </div>
              </div>
            </div>
          </MediaBackdrop>
        )}
      </div>
    </BnmLockedScreen>
  );
}