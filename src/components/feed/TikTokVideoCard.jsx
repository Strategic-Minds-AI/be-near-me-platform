import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play } from "lucide-react";

export default function TikTokVideoCard({ video }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);

  // Play only the video that's mostly in view; pause the rest.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.intersectionRatio >= 0.6) setActive(true);
          else if (e.intersectionRatio < 0.4) setActive(false);
        });
      },
      { threshold: [0, 0.4, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !paused) v.play().catch(() => {});
    else v.pause();
  }, [active, paused]);

  const fmt = (n) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000 ? (n / 1_000).toFixed(1) + "K"
    : String(n || 0);

  return (
    <section
      ref={ref}
      className="snap-start snap-always h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-black relative"
    >
      <video
        ref={videoRef}
        src={video.url}
        poster={video.poster_url || video.thumbnail_url}
        loop
        muted
        playsInline
        preload="metadata"
        onClick={() => setPaused((p) => !p)}
        className="h-full w-full object-cover"
      />

      {paused && active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/80 drop-shadow-lg" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

      {/* Creator + caption */}
      <div className="absolute left-4 bottom-6 right-20 text-white">
        <Link to={createPageUrl(`Channel?id=${video.channel_id}`)} className="block mb-2">
          <span className="font-bold text-base drop-shadow">@{video.channel_name || "creator"}</span>
        </Link>
        <p className="text-sm leading-snug line-clamp-3 drop-shadow">{video.title}</p>
        {video.tags?.length > 0 && (
          <p className="text-xs text-white/70 mt-1 line-clamp-1">
            {video.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-white/80">
          <Music2 className="w-3.5 h-3.5 animate-spin" />
          <span className="line-clamp-1">Original audio · {video.category || "video"}</span>
        </div>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-6 flex flex-col items-center gap-5 text-white">
        <Link to={createPageUrl(`Channel?id=${video.channel_id}`)}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg font-bold border-2 border-white">
            {(video.channel_name || "B")[0]?.toUpperCase()}
          </div>
        </Link>
        <button onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-1">
          <Heart className={`w-9 h-9 drop-shadow ${liked ? "fill-pink-500 text-pink-500" : "text-white"}`} />
          <span className="text-xs font-semibold">{fmt((video.likes || 0) + (liked ? 1 : 0))}</span>
        </button>
        <Link to={createPageUrl(`Watch?id=${video.id}`)} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-9 h-9 drop-shadow text-white" />
          <span className="text-xs font-semibold">{fmt(video.comments_count)}</span>
        </Link>
        <button className="flex flex-col items-center gap-1">
          <Bookmark className="w-9 h-9 drop-shadow text-white" />
          <span className="text-xs font-semibold">Save</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Share2 className="w-9 h-9 drop-shadow text-white" />
          <span className="text-xs font-semibold">Share</span>
        </button>
      </div>
    </section>
  );
}