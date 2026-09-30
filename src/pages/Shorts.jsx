import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreVertical,
  Music2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function Shorts() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shorts, isLoading } = useQuery({
    queryKey: ['shorts'],
    queryFn: () => base44.entities.Short.filter({ visibility: "public" }, "-views", 50),
  });

  const { data: comments } = useQuery({
    queryKey: ['shortComments', shorts?.[currentIndex]?.id],
    queryFn: () => base44.entities.Comment.filter(
      { video_id: shorts?.[currentIndex]?.id },
      "-created_date",
      50
    ),
    enabled: !!shorts?.[currentIndex]?.id && showComments,
  });

  const currentShort = shorts?.[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowDown" && currentIndex < (shorts?.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m") {
        setIsMuted(!isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, shorts?.length, isPlaying, isMuted]);

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isMuted, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToNext = () => {
    if (currentIndex < (shorts?.length || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Touch/scroll handling for swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
      isDragging = false;
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentIndex, shorts?.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!shorts?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-4">
        <span className="text-6xl mb-4">📱</span>
        <h2 className="text-2xl font-bold text-white mb-2">No Shorts Yet</h2>
        <p className="text-gray-400">Be the first to upload a short video!</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
      style={{ top: "64px", height: "calc(100vh - 64px)" }}
    >
      {/* Main Short View */}
      <div className="relative h-full max-w-[400px] w-full">
        {/* Video */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          {currentShort?.url ? (
            <video
              ref={videoRef}
              src={currentShort.url}
              className="h-full w-full object-cover"
              loop
              playsInline
              autoPlay
              muted={isMuted}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-8xl">🎬</span>
            </div>
          )}

          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-10 h-10 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Channel */}
          <div className="flex items-center gap-3 mb-3">
            <Link to={createPageUrl(`Channel?id=${currentShort?.channel_id}`)}>
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarImage src={currentShort?.channel_avatar} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {currentShort?.channel_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link 
                to={createPageUrl(`Channel?id=${currentShort?.channel_id}`)}
                className="font-semibold text-white hover:underline"
              >
                @{currentShort?.channel_name}
              </Link>
            </div>
            <Button size="sm" className="bg-white text-black hover:bg-gray-200 rounded-full h-8 px-4">
              Subscribe
            </Button>
          </div>

          {/* Title */}
          <p className="text-white text-sm line-clamp-2 mb-2">
            {currentShort?.title || currentShort?.description || "Untitled Short"}
          </p>

          {/* Audio Track */}
          {currentShort?.audio_track && (
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Music2 className="w-4 h-4" />
              <span className="truncate">{currentShort.audio_track.title} - {currentShort.audio_track.artist}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-6">
          {/* Like */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">{formatCount(currentShort?.likes || 0)}</span>
          </button>

          {/* Dislike */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <ThumbsDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Dislike</span>
          </button>

          {/* Comments */}
          <button 
            className="flex flex-col items-center gap-1"
            onClick={() => setShowComments(true)}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">{formatCount(currentShort?.comments_count || 0)}</span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs">Share</span>
          </button>

          {/* More */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <MoreVertical className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Sound Toggle */}
          <button 
            className="flex flex-col items-center gap-1"
            onClick={() => setIsMuted(!isMuted)}
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </div>
          </button>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === (shorts?.length || 0) - 1}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="absolute top-4 left-4 right-4">
          <div className="flex gap-1">
            {shorts?.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === currentIndex ? "bg-white" : i < currentIndex ? "bg-white/60" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[70vh] bg-[#0f0f0f] border-white/10 rounded-t-3xl">
          <SheetHeader className="border-b border-white/10 pb-4">
            <SheetTitle className="text-white">
              {currentShort?.comments_count || 0} Comments
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-4 overflow-auto h-[calc(100%-120px)]">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author_avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                    {comment.author_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{comment.author_name}</p>
                  <p className="text-gray-300 text-sm">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <button className="text-gray-500 text-xs flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {comment.likes || 0}
                    </button>
                    <button className="text-gray-500 text-xs">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0f0f0f]">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                    {user.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white resize-none h-10 py-2"
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}