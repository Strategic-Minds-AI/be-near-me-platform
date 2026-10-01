import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TikTokVideoCard from "@/components/feed/TikTokVideoCard";

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

export default function BnmFeed() {
  const containerRef = useRef(null);
  const { data: user } = useQuery({
    queryKey: ["bnmFeedUser"],
    queryFn: safeCurrentUser,
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnmFeed", user?.email],
    queryFn: async () => {
      if (user?.email) {
        try {
          const response = await base44.functions.invoke("recommendVideos", { limit: 30 });
          return response?.data?.videos || [];
        } catch {
          const fallback = await base44.entities.Video.filter({ visibility: "public" }, { sort: "-created_date", limit: 30 });
          return fallback?.items || fallback || [];
        }
      }
      const response = await base44.entities.Video.filter({ visibility: "public" }, { sort: "-created_date", limit: 30 });
      return response?.items || response || [];
    },
  });

  useEffect(() => {
    const handleKey = (event) => {
      const container = containerRef.current;
      if (!container) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        container.scrollBy({ top: container.clientHeight, behavior: "smooth" });
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        container.scrollBy({ top: -container.clientHeight, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-fuchsia-500" />
      </div>
    );
  }

  const feed = videos.filter((video) => video?.url);

  if (!feed.length) {
    return (
      <div className="relative flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#03050a] px-8 pb-24 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(213,0,255,.11),transparent_32%)]" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.035]">
          <Sparkles className="h-10 w-10 text-[#7b879e]" strokeWidth={1.6} />
        </div>
        <h2 className="relative mt-6 text-2xl font-extrabold tracking-tight">Your feed starts here</h2>
        <p className="relative mt-2 max-w-xs text-sm leading-6 text-[#8e99ae]">
          Follow creators or create your first video. Real public videos will appear here as they are posted.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black touch-pan-y [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {feed.map((video) => (
        <TikTokVideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
