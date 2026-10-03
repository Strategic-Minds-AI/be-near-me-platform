import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart3, Eye, Film, Heart, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  Pill,
  asItems,
  formatCount,
} from "@/components/bnm/LockedShell";

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmTracker() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnm-tracker-videos", user?.email],
    queryFn: async () =>
      asItems(
        await base44.entities.Video.filter(
          { created_by: user.email },
          { sort: "-published_at", limit: 50 }
        )
      ).filter(isProductionContent),
    enabled: Boolean(user?.email),
  });

  const stats = useMemo(() => {
    const views = videos.reduce((sum, video) => sum + Number(video.views || 0), 0);
    const likes = videos.reduce((sum, video) => sum + Number(video.likes || 0), 0);
    return {
      videos: videos.length,
      views,
      likes,
    };
  }, [videos]);

  if (!user) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            icon={BarChart3}
            title="Sign in to view creator performance"
            body="Your real published-video performance will appear here."
          />
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Creator Performance</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Video Tracker
          </h1>
          <p className="mt-1 text-sm text-[#8fa0c4]">
            Real performance from your published Be Near Me videos.
          </p>
        </Glass>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric icon={Film} label="Videos" value={formatCount(stats.videos)} />
          <Metric icon={Eye} label="Views" value={formatCount(stats.views)} />
          <Metric icon={Heart} label="Likes" value={formatCount(stats.likes)} />
        </div>

        <section className="pb-4 pt-4">
          <h2 className="mb-3 text-[16px] font-black text-white">Your Videos</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[18px] border border-[#263e68] bg-[#08162b]"
                />
              ))}
            </div>
          ) : videos.length ? (
            <div className="space-y-2">
              {videos.map((video) => (
                <Link key={video.id} to={"/watch?v=" + encodeURIComponent(video.id)}>
                  <Glass className="flex gap-3 p-2.5">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[#10213e]">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <Play className="h-5 w-5 text-[#8d6cff]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <p className="line-clamp-2 text-[12px] font-black text-white">
                        {video.title || "Untitled video"}
                      </p>
                      <div className="mt-2 flex gap-3 text-[10px] text-[#8799bd]">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatCount(video.views || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatCount(video.likes || 0)}
                        </span>
                      </div>
                    </div>
                  </Glass>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Film}
              title="No published videos yet"
              body="Record or upload your first real video and its performance will appear here."
            />
          )}
        </section>
      </div>
    </BnmLockedScreen>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <Glass className="p-3">
      <Icon className="h-5 w-5 text-[#a38bff]" />
      <p className="mt-2 text-[18px] font-black text-white">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7f91b4]">
        {label}
      </p>
    </Glass>
  );
}
