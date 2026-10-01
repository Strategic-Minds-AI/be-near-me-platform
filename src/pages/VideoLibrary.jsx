import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/video/VideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Library, Eye, Heart, MessageCircle, Clock, ChevronDown,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Videos" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
  { id: "vlogs", label: "Vlogs" },
  { id: "education", label: "Education" },
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "news", label: "News" },
  { id: "tech", label: "Tech" },
  { id: "comedy", label: "Comedy" },
  { id: "film", label: "Film" },
  { id: "howto", label: "How-To" },
  { id: "travel", label: "Travel" },
  { id: "food", label: "Food" },
  { id: "fashion", label: "Fashion" },
  { id: "art", label: "Art" },
  { id: "science", label: "Science" },
  { id: "pets", label: "Pets" },
  { id: "autos", label: "Autos" },
];

const SORTS = [
  { id: "-views", label: "Most Viewed", icon: Eye },
  { id: "-likes", label: "Most Liked", icon: Heart },
  { id: "-comments_count", label: "Most Discussed", icon: MessageCircle },
  { id: "-created_date", label: "Newest", icon: Clock },
];

export default function VideoLibrary() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("-views");
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(48);

  const filter = { visibility: "public" };
  if (category !== "all") filter.category = category;
  if (search.trim()) filter.title = { $regex: search.trim(), $options: "i" };

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videoLibrary', category, sort, search],
    queryFn: async () => {
      const page = await base44.entities.Video.filter(filter, { sort, limit: 100 });
      return page.items || [];
    },
  });

  const grouped = useMemo(() => {
    if (category !== "all" || search.trim()) return null;
    const map = {};
    (videos || []).forEach((v) => {
      const cat = v.category || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(v);
    });
    return map;
  }, [videos, category, search]);

  const currentSort = SORTS.find((s) => s.id === sort);
  const total = videos?.length || 0;
  const visibleVideos = (videos || []).slice(0, visibleCount);

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-pink-500" />
              <h1 className="text-lg font-bold text-white">Video Library</h1>
              <span className="text-sm text-gray-500">{total} videos</span>
            </div>
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((s) => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10"
              >
                <currentSort.icon className="w-4 h-4" />
                {currentSort.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden">
                    {SORTS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSort(s.id); setSortOpen(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-white/10 ${sort === s.id ? 'text-pink-400' : 'text-white'}`}
                      >
                        <s.icon className="w-4 h-4" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search videos by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-white/5 border-white/10 rounded-full text-white placeholder:text-gray-500"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-video rounded-xl" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Library className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No videos found</h3>
            <p className="text-sm text-gray-500">Try a different category or search term</p>
          </div>
        ) : grouped ? (
          /* Grouped by category */
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, vids]) => {
              const catLabel = CATEGORIES.find((c) => c.id === cat)?.label || cat;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white capitalize">{catLabel}</h2>
                    <span className="text-xs text-gray-500">{vids.length} videos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {vids.slice(0, 10).map((v) => (
                      <VideoCard key={v.id} video={v} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat grid for filtered category */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visibleVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
            {visibleCount < total && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setVisibleCount((c) => c + 48)}
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Load More ({total - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}