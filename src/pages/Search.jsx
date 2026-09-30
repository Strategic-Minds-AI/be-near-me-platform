import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VideoGrid from "@/components/video/VideoGrid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Filter, SlidersHorizontal, Calendar, Eye, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function Search() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get("q") || "";
  
  const [filter, setFilter] = useState("relevance");
  const [type, setType] = useState("all");

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['searchVideos', query],
    queryFn: () => base44.entities.Video.filter({ visibility: "public" }, "-views", 100),
    enabled: !!query,
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['searchChannels', query],
    queryFn: () => base44.entities.Channel.list("-subscribers_count", 50),
    enabled: !!query,
  });

  // Client-side search with weighted scoring
  // Title×5, Tags×3, Description×2, Views×4, Like ratio×2
  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    const q = query.toLowerCase();
    const terms = q.split(" ").filter(Boolean);

    const scored = videos.map(video => {
      const title = (video.title || "").toLowerCase();
      const desc = (video.description || "").toLowerCase();
      const tags = (video.tags || []).join(" ").toLowerCase();
      const channel = (video.channel_name || "").toLowerCase();

      // Text relevance
      let textScore = 0;
      for (const term of terms) {
        if (title.includes(term)) textScore += 5;
        if (tags.includes(term)) textScore += 3;
        if (desc.includes(term)) textScore += 2;
        if (channel.includes(term)) textScore += 1;
      }
      // Exact phrase bonus
      if (title.includes(q)) textScore += 8;

      if (textScore === 0) return null; // exclude irrelevant

      // Engagement signals (normalized)
      const views = video.views || 0;
      const likes = video.likes || 0;
      const dislikes = video.dislikes || 0;
      const totalReactions = likes + dislikes;
      const likeRatio = totalReactions > 0 ? likes / totalReactions : 0.5;
      const viewScore = Math.log10(Math.max(views, 1)) * 4;
      const likeScore = likeRatio * 2 * 10;

      const totalScore = textScore * 10 + viewScore + likeScore;
      return { video, score: totalScore };
    }).filter(Boolean);

    const sorted = scored.sort((a, b) => {
      if (filter === "date") return new Date(b.video.created_date) - new Date(a.video.created_date);
      if (filter === "views") return (b.video.views || 0) - (a.video.views || 0);
      return b.score - a.score;
    });

    return sorted.map(s => s.video);
  }, [videos, query, filter]);

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    const searchTerms = query.toLowerCase().split(" ");
    return channels.filter(channel => {
      const searchText = `${channel.name} ${channel.handle} ${channel.description}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });
  }, [channels, query]);

  const isLoading = videosLoading || channelsLoading;

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Search results for "{query}"
          </h1>
          <p className="text-gray-400 mt-1">
            {filteredVideos.length} videos found
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={type} onValueChange={setType}>
            <TabsList className="bg-white/5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#212121] border-white/10 w-48">
              <DropdownMenuLabel className="text-gray-400">Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => setFilter("relevance")}
                className={filter === "relevance" ? "bg-white/10" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Relevance
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter("date")}
                className={filter === "date" ? "bg-white/10" : ""}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Upload date
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilter("views")}
                className={filter === "views" ? "bg-white/10" : ""}
              >
                <Eye className="w-4 h-4 mr-2" />
                View count
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Channels Section */}
      {(type === "all" || type === "channels") && filteredChannels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Channels</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChannels.slice(0, type === "channels" ? 20 : 3).map((channel) => (
              <Link
                key={channel.id}
                to={createPageUrl(`Channel?id=${channel.id}`)}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Avatar className="w-16 h-16">
                  <AvatarImage src={channel.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                    {channel.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{channel.name}</h3>
                  <p className="text-gray-400 text-sm">@{channel.handle}</p>
                  <p className="text-gray-500 text-sm">
                    {formatCount(channel.subscribers_count || 0)} subscribers
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {(type === "all" || type === "videos") && (
        <div>
          {type === "all" && filteredChannels.length > 0 && (
            <h2 className="text-lg font-semibold text-white mb-4">Videos</h2>
          )}
          <VideoGrid videos={filteredVideos} isLoading={isLoading} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredVideos.length === 0 && filteredChannels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-5xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-400">
            Try different keywords or check for typos
          </p>
        </div>
      )}
    </div>
  );
}