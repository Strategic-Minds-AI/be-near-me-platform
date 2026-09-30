import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function ChannelCard({ channel, variant = "default" }) {
  const isCompact = variant === "compact";

  return (
    <Link
      to={createPageUrl(`Channel?id=${channel.id}`)}
      className={`group block ${isCompact ? "" : "text-center"}`}
    >
      <div className={`flex ${isCompact ? "flex-row items-center gap-4" : "flex-col items-center"}`}>
        <Avatar className={`${isCompact ? "w-12 h-12" : "w-24 h-24 md:w-32 md:h-32"} ring-2 ring-transparent group-hover:ring-red-500 transition-all`}>
          <AvatarImage src={channel.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl md:text-4xl">
            {channel.name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <div className={`${isCompact ? "" : "mt-3"}`}>
          <div className="flex items-center justify-center gap-1">
            <h3 className={`font-semibold text-white group-hover:text-red-400 transition-colors ${isCompact ? "text-base" : "text-lg"}`}>
              {channel.name}
            </h3>
            {channel.verified && (
              <CheckCircle className="w-4 h-4 text-gray-400 fill-current" />
            )}
          </div>
          
          <p className="text-gray-400 text-sm">@{channel.handle}</p>
          
          <p className="text-gray-500 text-sm mt-1">
            {formatCount(channel.subscribers_count || 0)} subscribers
          </p>
        </div>
      </div>
    </Link>
  );
}