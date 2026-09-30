import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VideoGrid from "@/components/video/VideoGrid";
import { 
  Flame, 
  Music2, 
  Gamepad2, 
  Film, 
  Trophy, 
  Lightbulb, 
  Newspaper,
  Shirt,
  Utensils,
  Plane,
  Palette,
  FlaskConical,
  Cat,
  Car
} from "lucide-react";

const categories = [
  { id: "gaming", label: "Gaming", icon: Gamepad2, color: "from-green-500 to-emerald-600" },
  { id: "music", label: "Music", icon: Music2, color: "from-red-500 to-pink-600" },
  { id: "film", label: "Film & Animation", icon: Film, color: "from-purple-500 to-violet-600" },
  { id: "sports", label: "Sports", icon: Trophy, color: "from-orange-500 to-amber-600" },
  { id: "education", label: "Education", icon: Lightbulb, color: "from-blue-500 to-cyan-600" },
  { id: "news", label: "News", icon: Newspaper, color: "from-slate-500 to-gray-600" },
  { id: "fashion", label: "Fashion", icon: Shirt, color: "from-pink-500 to-rose-600" },
  { id: "food", label: "Food", icon: Utensils, color: "from-yellow-500 to-orange-600" },
  { id: "travel", label: "Travel", icon: Plane, color: "from-sky-500 to-blue-600" },
  { id: "art", label: "Art", icon: Palette, color: "from-fuchsia-500 to-purple-600" },
  { id: "science", label: "Science", icon: FlaskConical, color: "from-teal-500 to-green-600" },
  { id: "pets", label: "Pets", icon: Cat, color: "from-amber-500 to-yellow-600" },
  { id: "autos", label: "Autos", icon: Car, color: "from-zinc-500 to-neutral-600" },
];

export default function Explore() {
  const { data: trendingVideos, isLoading: trendingLoading } = useQuery({
    queryKey: ['trendingVideos'],
    queryFn: () => base44.entities.Video.filter({ visibility: "public" }, "-views", 12),
  });

  const { data: recentVideos, isLoading: recentLoading } = useQuery({
    queryKey: ['recentVideos'],
    queryFn: () => base44.entities.Video.filter({ visibility: "public" }, "-created_date", 12),
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-8 h-8 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Explore</h1>
          </div>
          <p className="text-white/80 text-lg max-w-xl">
            Discover trending videos, popular creators, and content you'll love
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <span className="text-[200px]">🔥</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={createPageUrl(`Category?c=${category.id}`)}
              className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${category.color} group hover:scale-105 transition-transform duration-200`}
            >
              <div className="relative z-10">
                <category.icon className="w-8 h-8 text-white mb-2" />
                <h3 className="font-semibold text-white">{category.label}</h3>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Videos */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
          </div>
          <Link 
            to={createPageUrl("Trending")}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            See all
          </Link>
        </div>
        <VideoGrid videos={trendingVideos} isLoading={trendingLoading} />
      </div>

      {/* Recently Uploaded */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recently Uploaded</h2>
        </div>
        <VideoGrid videos={recentVideos} isLoading={recentLoading} />
      </div>
    </div>
  );
}