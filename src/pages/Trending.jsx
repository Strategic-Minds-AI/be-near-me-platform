import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import VideoGrid from "@/components/video/VideoGrid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Music2, Gamepad2, Film, Trophy } from "lucide-react";

const trendingCategories = [
  { id: "all", label: "All", icon: Flame },
  { id: "music", label: "Music", icon: Music2 },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "film", label: "Movies", icon: Film },
  { id: "sports", label: "Sports", icon: Trophy },
];

export default function Trending() {
  const [category, setCategory] = useState("all");

  const { data: videos, isLoading } = useQuery({
    queryKey: ['trendingVideos', category],
    queryFn: async () => {
      if (category === "all") {
        return base44.entities.Video.filter({ visibility: "public" }, "-views", 50);
      }
      return base44.entities.Video.filter(
        { visibility: "public", category },
        "-views",
        50
      );
    },
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-gray-400">What's hot right now</p>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={category} onValueChange={setCategory} className="mb-6">
        <TabsList className="bg-white/5 p-1">
          {trendingCategories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Videos */}
      <VideoGrid videos={videos} isLoading={isLoading} />
    </div>
  );
}