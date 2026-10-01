import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import TikTokVideoCard from "./TikTokVideoCard";
import { Link } from "react-router-dom";
import { Loader2, Flame, TrendingUp } from "lucide-react";

const TRENDING_TAGS = ["#kindness", "#benearme", "#wholesome", "#goodvibes", "#positivity", "#spreadlove"];

export default function TikTokFeed() {
  const containerRef = useRef(null);
  const [tagsHidden, setTagsHidden] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['tiktokFeed', user?.email],
    queryFn: async () => {
      if (user?.email) {
        const res = await base44.functions.invoke('recommendVideos', { limit: 30 });
        return res.data?.videos || [];
      }
      const page = await base44.entities.Video.filter({ visibility: "public" }, { sort: "-views", limit: 30 });
      return page.items || [];
    },
  });

  // Keyboard navigation — arrow up/down moves between videos, like TikTok web.
  useEffect(() => {
    const onKey = (e) => {
      const c = containerRef.current;
      if (!c) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); c.scrollBy({ top: c.clientHeight, behavior: 'smooth' }); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); c.scrollBy({ top: -c.clientHeight, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const list = (videos || []).filter((v) => v.url);

  if (list.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white/70 text-center px-6">
        <div>
          <p className="text-lg font-semibold mb-1">No videos yet</p>
          <p className="text-sm">Upload a video to start the feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={() => { if (containerRef.current?.scrollTop > 40) setTagsHidden(true); else setTagsHidden(false); }}
      className="h-[calc(100vh-3.5rem)] overflow-y-scroll snap-y snap-mandatory overscroll-y-contain touch-pan-y bg-black [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Trending hashtags bar — floats over the feed, fades on scroll */}
      <div className={`sticky top-0 z-20 flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${tagsHidden ? 'opacity-0' : 'opacity-100'}`}>
        <Flame className="w-4 h-4 text-pink-500 flex-shrink-0 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]" />
        {TRENDING_TAGS.map((tag) => (
          <span key={tag} className="text-xs font-bold text-white bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full whitespace-nowrap">
            {tag}
          </span>
        ))}
        <Link to="/Trending" className="text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-fuchsia-600 border border-pink-400/40 px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 shadow-[0_0_12px_rgba(236,72,153,0.4)]">
          <TrendingUp className="w-3 h-3" /> Top Videos
        </Link>
      </div>

      {list.map((v) => (
        <TikTokVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}