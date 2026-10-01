import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play, Volume2, VolumeX } from "lucide-react";
import ShareSheet from "./ShareSheet";

export default function TikTokVideoCard({ video }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  const ytMatch = video.url?.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  const isYouTube = !!ytMatch;
  const ytId = ytMatch?.[1] || '';

  const shareUrl = `${window.location.origin}/Watch?v=${video.id}`;

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
    v.muted = muted;
    if (active && !paused) v.play().catch(() => {});
    else v.pause();
  }, [active, paused, muted]);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      lastTap.current = 0;
      setLiked(true);
      setHeartPop(true);
      setTimeout(() => setHeartPop(false), 650);
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        setPaused((p) => !p);
        tapTimer.current = null;
      }, 280);
    }
  };

  const fmt = (n) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000 ? (n / 1_000).toFixed(1) + "K"
    : String(n || 0);

  return (
    <section
      ref={ref}
      className="snap-start snap-always h-[100dvh] w-full flex items-center justify-center bg-black relative"
    >
      {isYouTube ? (
        <>
          <iframe
            src={active ? `${video.url}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3` : "about:blank"}
            className="h-full w-full object-cover pointer-events-none"
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={video.title}
          />
          {/* Mask the YouTube watermark/logo in the top-left corner */}
          <div className="absolute top-0 left-0 z-20 h-20 w-44 bg-gradient-to-r from-black via-black/85 to-transparent pointer-events-none" />
        </>
      ) : (
        <video
          ref={videoRef}
          src={video.url}
          poster={video.poster_url || video.thumbnail_url}
          loop
          muted
          playsInline
          preload="metadata"
          onClick={handleTap}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress((v.currentTime / v.duration) * 100);
          }}
          className="h-full w-full object-cover"
        />
      )}

      {/* Progress bar */}
      {!isYouTube && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 z-20">
          <div className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-[width] duration-100 shadow-[0_0_8px_rgba(236,72,153,0.6)]" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Mute toggle */}
      {!isYouTube && (
        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Double-tap heart pop */}
      <AnimatePresence>
        {heartPop && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Heart className="w-28 h-28 text-pink-500 fill-pink-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isYouTube && paused && active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/80 drop-shadow-lg" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Creator + caption */}
      <div className="absolute left-4 bottom-6 right-20 text-white z-10" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
        <Link to={createPageUrl(`Channel?id=${video.channel_id}`)} className="block mb-2">
          <span className="font-extrabold text-lg tracking-tight">@{video.channel_name || "creator"}</span>
        </Link>
        <p className="font-semibold text-sm leading-snug line-clamp-3">{video.title}</p>
        {video.tags?.length > 0 && (
          <p className="text-xs font-medium text-white/80 mt-1.5 line-clamp-1">
            {video.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-white/90">
          <Music2 className="w-3.5 h-3.5 animate-spin" />
          <span className="line-clamp-1">Original audio · {video.category || "video"}</span>
        </div>
      </div>

      {/* Right action rail — premium frosted glass buttons */}
      <div className="absolute right-3 bottom-6 flex flex-col items-center gap-4 text-white z-10" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
        <Link to={createPageUrl(`Channel?id=${video.channel_id}`)}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center text-lg font-bold border-2 border-white shadow-[0_0_16px_rgba(236,72,153,0.4)]">
            {(video.channel_name || "B")[0]?.toUpperCase()}
          </div>
        </Link>
        <button onClick={() => setLiked((l) => !l)} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:shadow-[0_0_16px_rgba(236,72,153,0.4)] ${liked ? 'bg-pink-500/20 border-pink-500/60' : 'bg-black/30 border-white/20 group-hover:border-pink-500/50'}`}>
            <Heart className={`w-7 h-7 transition-transform ${liked ? "fill-pink-500 text-pink-500 scale-110" : "text-white"}`} />
          </div>
          <span className="text-xs font-bold">{fmt((video.likes || 0) + (liked ? 1 : 0))}</span>
        </button>
        <Link to={createPageUrl(`Watch?v=${video.id}`)} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-pink-500/50 group-hover:shadow-[0_0_16px_rgba(236,72,153,0.4)]">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold">{fmt(video.comments_count)}</span>
        </Link>
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-pink-500/50 group-hover:shadow-[0_0_16px_rgba(236,72,153,0.4)]">
            <Bookmark className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold">Save</span>
        </button>
        <button onClick={() => setShareOpen(true)} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-pink-500/50 group-hover:shadow-[0_0_16px_rgba(236,72,153,0.4)]">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold">Share</span>
        </button>
      </div>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={video.title} videoId={video.id} />
    </section>
  );
}