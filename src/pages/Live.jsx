import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Users, Eye, Play } from "lucide-react";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function Live() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: liveStreams, isLoading } = useQuery({
    queryKey: ['liveStreams'],
    queryFn: () => base44.entities.LiveStream.filter(
      { status: "live", visibility: "public" },
      "-viewers_current",
      50
    ),
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full animate-pulse">
              <Radio className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">LIVE</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Live Streaming</h1>
          <p className="text-white/80 text-lg max-w-xl">
            Watch live content from your favorite creators or start your own stream
          </p>
        </div>
        <div className="absolute right-8 bottom-0 opacity-20">
          <Radio className="w-48 h-48" />
        </div>
      </div>

      {/* Live Now */}
      {liveStreams?.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveStreams.map((stream) => (
              <Link
                key={stream.id}
                to={createPageUrl(`LiveWatch?id=${stream.id}`)}
                className="group"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
                  {stream.thumbnail_url ? (
                    <img
                      src={stream.thumbnail_url}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                      <Radio className="w-12 h-12 text-white animate-pulse" />
                    </div>
                  )}
                  
                  {/* Live badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Badge className="bg-red-600 text-white text-xs">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                      LIVE
                    </Badge>
                    <Badge className="bg-black/60 text-white text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {formatCount(stream.viewers_current || 0)}
                    </Badge>
                  </div>

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={stream.channel_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                      {stream.channel_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{stream.channel_name}</p>
                    <p className="text-gray-500 text-sm">{stream.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Radio className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No live streams right now</h3>
          <p className="text-gray-400 max-w-md mb-6">
            Check back later or explore other content while you wait
          </p>
          <div className="flex gap-3">
            <Link to={createPageUrl("Explore")}>
              <Button className="bg-white/10 hover:bg-white/20 text-white rounded-full">
                Explore Videos
              </Button>
            </Link>
            <Link to={createPageUrl("StudioLive")}>
              <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full">
                <Radio className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          { 
            icon: Radio, 
            title: "Go Live", 
            description: "Stream directly from your browser or use OBS/Streamlabs" 
          },
          { 
            icon: Users, 
            title: "Live Chat", 
            description: "Engage with your audience in real-time with live chat" 
          },
          { 
            icon: Eye, 
            title: "Live Stats", 
            description: "See viewer count, engagement, and analytics in real-time" 
          },
        ].map((feature) => (
          <div key={feature.title} className="p-6 bg-white/5 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}