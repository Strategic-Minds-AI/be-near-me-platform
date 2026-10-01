import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import TikTokVideoCard from "./TikTokVideoCard";
import { Link } from "react-router-dom";
import { Loader2, Flame, TrendingUp, Sparkles } from "lucide-react";

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
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to Be Near Me</h2>
        <p className="text-gray-400 text-sm max-w-xs mb-8">
          The feed is waiting to be filled with kindness. Here's how to get started:
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/CreateChannel" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              <span className="text-pink-400 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Create your channel</p>
              <p className="text-gray-500 text-xs">Set up your profile</p>
            </div>
          </Link>
          <Link to="/Camera" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              <span className="text-pink-400 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Record a video</p>
              <p className="text-gray-500 text-xs">Share a kindness moment</p>
            </div>
          </Link>
          <Link to="/Dares" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              <span className="text-pink-400 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Send a dare</p>
              <p className="text-gray-500 text-xs">Challenge a friend to be kind</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={() => { if (containerRef.current?.scrollTop > 40) setTagsHidden(true); else setTagsHidden(false); }}
      className="h-screen overflow-y-scroll snap-y snap-mandatory overscroll-y-contain touch-pan-y bg-black [&::-webkit-scrollbar]:hidden"
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