import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VideoGrid from "@/components/video/VideoGrid";
import CategoryPills from "@/components/video/CategoryPills";
import PremiumBanner from "@/components/subscription/PremiumBanner";
import ChannelCard from "@/components/channel/ChannelCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Radio, Flame, TrendingUp } from "lucide-react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPremiumBanner, setShowPremiumBanner] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', selectedCategory, user?.email],
    queryFn: async () => {
      // Use recommendation engine when user is logged in
      if (user?.email) {
        const res = await base44.functions.invoke('recommendVideos', {
          limit: 40,
          category: selectedCategory === "All" ? null : selectedCategory,
        });
        return res.data?.videos || [];
      }
      // Fallback for unauthenticated users
      if (selectedCategory === "All") {
        return base44.entities.Video.filter({ visibility: "public" }, "-created_date", 50);
      }
      return base44.entities.Video.filter(
        { visibility: "public", category: selectedCategory.toLowerCase() },
        "-created_date",
        50
      );
    },
    enabled: true,
  });

  const { data: liveStreams } = useQuery({
    queryKey: ['homeLiveStreams'],
    queryFn: () => base44.entities.LiveStream.filter(
      { status: "live", visibility: "public" },
      "-viewers_current",
      5
    ),
  });

  const { data: trendingVideos } = useQuery({
    queryKey: ['trendingHome'],
    queryFn: () => base44.entities.Video.filter(
      { visibility: "public" },
      "-views",
      10
    ),
  });

  const { data: channels } = useQuery({
    queryKey: ['popularChannels'],
    queryFn: () => base44.entities.Channel.list("-subscribers_count", 10),
  });

  return (
    <div className="min-h-screen">
      {/* Category Pills */}
      <div className="sticky top-16 z-40 bg-[#0f0f0f] border-b border-white/5 py-3">
        <CategoryPills 
          selected={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {/* Premium Banner (for non-premium users) */}
        {showPremiumBanner && user && user.tier !== "gold" && user.tier !== "pro" && (
          <PremiumBanner onClose={() => setShowPremiumBanner(false)} />
        )}

        {/* Live Now Section */}
        {liveStreams?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white">Live Now</h2>
              <Badge className="bg-red-600 text-white animate-pulse">
                {liveStreams.length} Live
              </Badge>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {liveStreams.map((stream) => (
                  <Link
                    key={stream.id}
                    to={createPageUrl(`LiveWatch?id=${stream.id}`)}
                    className="flex-shrink-0 w-72 group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5">
                      {stream.thumbnail_url ? (
                        <img
                          src={stream.thumbnail_url}
                          alt={stream.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                          <Radio className="w-10 h-10 text-white animate-pulse" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-black/70 text-white text-xs">
                          {stream.viewers_current || 0} watching
                        </Badge>
                      </div>
                    </div>
                    <h3 className="mt-2 text-white font-medium line-clamp-1 group-hover:text-red-400">
                      {stream.title}
                    </h3>
                    <p className="text-gray-400 text-sm">{stream.channel_name}</p>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Trending Section */}
        {selectedCategory === "All" && trendingVideos?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-white">Trending</h2>
              </div>
              <Link to={createPageUrl("Trending")} className="text-blue-400 hover:text-blue-300 text-sm">
                See all
              </Link>
            </div>
            <VideoGrid videos={trendingVideos.slice(0, 5)} isLoading={false} />
          </section>
        )}

        {/* Main Video Grid */}
        <section>
          {selectedCategory !== "All" && (
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {selectedCategory}
            </h2>
          )}
          <VideoGrid videos={selectedCategory === "All" ? videos?.slice(10) : videos} isLoading={isLoading} />
        </section>

        {/* Popular Channels */}
        {selectedCategory === "All" && channels?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Popular Channels</h2>
              <Link to={createPageUrl("Explore")} className="text-blue-400 hover:text-blue-300 text-sm">
                Explore more
              </Link>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-6 pb-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex-shrink-0">
                    <ChannelCard channel={channel} />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}
      </div>
    </div>
  );
}