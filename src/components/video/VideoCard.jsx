import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Clock, ListPlus, Share2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function formatViews(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

export default function VideoCard({ video, variant = "default" }) {
  const isHorizontal = variant === "horizontal";

  return (
    <div className={`group ${isHorizontal ? "flex gap-3" : ""}`}>
      {/* Thumbnail */}
      <Link 
        to={createPageUrl(`Watch?v=${video.id}`)}
        className={`relative block ${isHorizontal ? "w-40 md:w-44 flex-shrink-0" : "w-full"} aspect-video rounded-xl overflow-hidden bg-white/5`}
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
        )}
        
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
      </Link>

      {/* Info */}
      <div className={`flex gap-3 ${isHorizontal ? "flex-1 min-w-0" : "mt-3"}`}>
        {!isHorizontal && (
          <Link to={createPageUrl(`Channel?id=${video.created_by}`)}>
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={video.channel_avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                {video.channel_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link 
              to={createPageUrl(`Watch?v=${video.id}`)}
              className="block"
            >
              <h3 className={`font-medium text-white line-clamp-2 group-hover:text-red-400 transition-colors ${isHorizontal ? "text-sm" : ""}`}>
                {video.title}
              </h3>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Clock className="w-4 h-4" />
                  Watch Later
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <ListPlus className="w-4 h-4" />
                  Add to Playlist
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Share2 className="w-4 h-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-400">
                  <Flag className="w-4 h-4" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link 
            to={createPageUrl(`Channel?id=${video.created_by}`)}
            className="block mt-1"
          >
            <p className={`text-gray-400 hover:text-gray-300 transition-colors ${isHorizontal ? "text-xs" : "text-sm"}`}>
              {video.channel_name || "Unknown Channel"}
            </p>
          </Link>

          <div className={`flex items-center gap-1 text-gray-500 ${isHorizontal ? "text-xs" : "text-sm"}`}>
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{timeAgo(video.created_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}