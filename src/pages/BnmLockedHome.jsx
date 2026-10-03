import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Bookmark, Heart, Leaf, MessageCircle, Music2, Play, Plus, Share2, Sparkles
} from "lucide-react";
import {
  Avatar, BnmLockedScreen, Glass, MediaBackdrop, Pill, asItems, formatCount
} from "@/components/bnm/LockedShell";

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return Boolean(video?.channel_id) && !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmLockedHome() {
  const { data: allVideos = [], isLoading } = useQuery({
    queryKey: ["bnm-lock-public-videos-v2"],
    queryFn: async () => asItems(await base44.entities.Video.filter({ visibility: "public" }, "-created_date", 80)),
  });

  const video = allVideos.find(isProductionContent);

  return (
    <BnmLockedScreen activeSection="For You">
      <div className="px-2 pb-2 pt-1">
        {isLoading ? (
          <div className="h-[calc(100dvh-184px)] min-h-[590px] animate-pulse rounded-[22px] border border-[#21385e] bg-[#0b1930]" />
        ) : video ? (
          <MediaBackdrop
            src={video.poster_url || video.thumbnail_url}
            className="min-h-[calc(100dvh-184px)] min-h-[590px] border border-[#273f67]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,9,22,.18)_0%,transparent_26%,transparent_55%,rgba(1,6,16,.92)_100%)]" />

            <div className="relative flex min-h-[calc(100dvh-184px)] min-h-[590px] flex-col px-3 pb-4 pt-3">
              <div className="flex items-center justify-between gap-2">
                <Glass className="flex items-center gap-2 rounded-full px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#57d8ff]" />
                  <span className="text-[10px] font-black text-[#edf4ff]">NEARBY</span>
                </Glass>
                <Glass className="flex items-center gap-2 rounded-full px-3 py-2">
                  <Play className="h-3.5 w-3.5 text-[#ff43b5]" fill="currentColor" />
                  <span className="text-[10px] font-black">{formatCount(video.views)} views</span>
                </Glass>
              </div>

              <div className="mt-auto grid grid-cols-[1fr_54px] gap-2">
                <div className="self-end pb-1">
                  <Link to="/challenge" className="inline-flex">
                    <Pill active><Leaf className="h-3.5 w-3.5" /> Kindness Challenge</Pill>
                  </Link>

                  <div className="mt-3 flex items-center gap-2">
                    <Avatar src={video.channel_avatar} label={video.channel_name || "BN"} size={42} />
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-black">{video.channel_name || "Be Near Me Creator"}</div>
                      <div className="text-[10px] text-[#b1bfd8]">Community creator</div>
                    </div>
                    <Link
                      to={video.channel_id ? "/profile?channel=" + encodeURIComponent(video.channel_id) : "/profile"}
                      className="ml-1 rounded-full bg-gradient-to-r from-[#ff37ae] to-[#a34fff] px-3 py-1.5 text-[10px] font-black"
                    >
                      + Follow
                    </Link>
                  </div>

                  <h1 className="mt-3 line-clamp-2 max-w-[290px] text-[15px] font-black leading-5">{video.title}</h1>
                  {video.description ? (
                    <p className="mt-1 line-clamp-2 max-w-[300px] text-[11px] leading-4 text-[#e4ebf7]">{video.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(video.tags || []).filter((tag) => !["seed", "scraped", "youtube"].includes(String(tag).toLowerCase())).slice(0, 3).map((tag) => (
                      <Pill key={tag}>#{String(tag).replace(/^#/, "")}</Pill>
                    ))}
                  </div>

                  <div className="mt-3 flex max-w-[300px] items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                    <Music2 className="h-3.5 w-3.5 text-[#c5a2ff]" />
                    <span className="truncate text-[10px] text-[#d9e2f3]">Original community post</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end gap-3 pb-1">
                  <Avatar src={video.channel_avatar} label={video.channel_name || "BN"} size={45} />
                  <div className="-mt-5 grid h-5 w-5 place-items-center rounded-full bg-[#ff3cae] ring-2 ring-[#0b1120]">
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ff37aa] text-white shadow-[0_0_20px_rgba(255,55,170,.32)]">
                    <Heart className="h-6 w-6" fill="white" />
                  </div>
                  <span className="-mt-2 text-[9px] font-black">{formatCount(video.likes)}</span>

                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <span className="-mt-2 text-[9px] font-black">{formatCount(video.comments_count)}</span>

                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur">
                    <Bookmark className="h-6 w-6" />
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur">
                    <Share2 className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </MediaBackdrop>
        ) : (
          <div className="relative flex h-[calc(100dvh-184px)] min-h-[590px] flex-col overflow-hidden rounded-[22px] border border-[#263f68] bg-[radial-gradient(circle_at_50%_20%,rgba(68,117,255,.28),transparent_32%),radial-gradient(circle_at_20%_78%,rgba(255,48,169,.18),transparent_34%),#071329] px-6 py-5">
            <div className="flex items-center justify-between">
              <Pill active><Leaf className="h-3.5 w-3.5" /> Kindness Feed</Pill>
              <Pill>Live data only</Pill>
            </div>
            <div className="my-auto text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-[#24c7ff] via-[#8b52ff] to-[#ff37aa] shadow-[0_0_44px_rgba(130,84,255,.35)]">
                <Heart className="h-9 w-9" fill="white" />
              </div>
              <h1 className="mx-auto mt-5 max-w-[300px] text-[28px] font-black leading-[1.02] tracking-[-.04em]">Your local kindness feed starts here.</h1>
              <p className="mx-auto mt-3 max-w-[310px] text-[12px] leading-5 text-[#a9b8d4]">
                No verified Be Near Me community videos are public yet. Seed and scraped donor content is intentionally excluded.
              </p>
              <div className="mx-auto mt-5 grid max-w-[290px] grid-cols-2 gap-2">
                <Link to="/create" className="rounded-full bg-gradient-to-r from-[#26c8ff] via-[#8753ff] to-[#ff38aa] px-4 py-3 text-[12px] font-black">Create First Post</Link>
                <Link to="/challenge" className="rounded-full border border-[#576f9f] bg-[#101e3b] px-4 py-3 text-[12px] font-black">Find a Challenge</Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] text-[#8799bd]">
              <span>Real creators</span><span>Real local activity</span><span>No fake metrics</span>
            </div>
          </div>
        )}
      </div>
    </BnmLockedScreen>
  );
}
