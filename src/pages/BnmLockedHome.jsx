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
          <div className="relative h-[calc(100dvh-184px)] min-h-[590px] overflow-hidden rounded-[22px] border border-[#263f68] bg-[radial-gradient(circle_at_50%_16%,rgba(67,109,255,.22),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(255,48,169,.14),transparent_32%),#061225]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,38,.18),transparent_28%,rgba(1,8,19,.82)_100%)]" />
            <div className="relative flex h-full flex-col px-3 pb-4 pt-3">
              <div className="flex items-center justify-between gap-2">
                <Pill active><Leaf className="h-3.5 w-3.5" /> Kindness Feed</Pill>
              </div>

              <div className="mt-auto grid grid-cols-[1fr_52px] gap-2">
                <div className="self-end pb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full border border-[#3b557f] bg-[#0b1931]" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3.5 w-28 rounded-full bg-[#1a2a48]" />
                      <div className="mt-1.5 h-2.5 w-20 rounded-full bg-[#14233e]" />
                    </div>
                    <div className="rounded-full border border-[#495f87] bg-[#101d37] px-3 py-1.5 text-[9px] font-black text-[#8193b5]">Follow</div>
                  </div>

                  <div className="mt-4 h-4 w-[84%] rounded-full bg-[#192a47]" />
                  <div className="mt-2 h-3 w-[68%] rounded-full bg-[#13223d]" />
                  <div className="mt-2 h-3 w-[48%] rounded-full bg-[#13223d]" />

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Pill>#Kindness</Pill><Pill>#Community</Pill>
                  </div>

                  <div className="mt-4 flex max-w-[245px] items-center gap-2 rounded-full border border-[#31496f] bg-[#09172c] px-3 py-2 text-[#8295b8]">
                    <Music2 className="h-3.5 w-3.5" />
                    <span className="truncate text-[9px]">Audio appears with a real post</span>
                  </div>

                  <div className="mt-5 max-w-[260px] rounded-[18px] border border-[#2b436b] bg-[#08162b]/94 p-4">
                    <div className="text-[15px] font-black">Your local kindness feed starts here.</div>
                    <p className="mt-1.5 text-[10px] leading-4 text-[#91a2c3]">
                      No verified Be Near Me video is public yet. The finished feed geometry stays intact without fabricated creators, captions, locations, or metrics.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link to="/create" className="rounded-full bg-gradient-to-r from-[#26c8ff] via-[#8753ff] to-[#ff38aa] px-3 py-2 text-[9px] font-black">Create</Link>
                      <Link to="/challenge" className="rounded-full border border-[#4c648e] bg-[#101d37] px-3 py-2 text-[9px] font-black">Challenges</Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end gap-3 pb-1 text-[#8092b6]">
                  <div className="h-11 w-11 rounded-full border border-[#3b557f] bg-[#0b1931]" />
                  <div className="-mt-5 grid h-5 w-5 place-items-center rounded-full bg-[#4d315c] ring-2 ring-[#061225]"><Plus className="h-3 w-3" /></div>

                  <div className="grid h-11 w-11 place-items-center rounded-full border border-[#40577d] bg-[#0b1830]"><Heart className="h-5 w-5" /></div>
                  <span className="-mt-2 text-[9px]">—</span>

                  <div className="grid h-11 w-11 place-items-center rounded-full border border-[#40577d] bg-[#0b1830]"><MessageCircle className="h-5 w-5" /></div>
                  <span className="-mt-2 text-[9px]">—</span>

                  <div className="grid h-11 w-11 place-items-center rounded-full border border-[#40577d] bg-[#0b1830]"><Bookmark className="h-5 w-5" /></div>
                  <div className="grid h-11 w-11 place-items-center rounded-full border border-[#40577d] bg-[#0b1830]"><Share2 className="h-5 w-5" /></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BnmLockedScreen>
  );
}