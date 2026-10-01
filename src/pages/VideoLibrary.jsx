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
    <div className="min-h-screen pb-20 bg-black">
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-xl border-b-2 border-white/20">
        <div className="px-4 pt-4 pb-3">
          {/* Editorial header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Library className="w-5 h-5 text-pink-500" strokeWidth={2.5} />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">Browse</span>
              </div>
              <h1 className="text-4xl font-black text-white leading-none tracking-tight">Video Library</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">{total} videos</p>
            </div>
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((s) => !s)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <currentSort.icon className="w-4 h-4" />
                {currentSort.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl bg-[#1a1a1a] border border-white/15 overflow-hidden shadow-2xl">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-white/10">Sort by</div>
                    {SORTS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSort(s.id); setSortOpen(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors ${sort === s.id ? 'text-pink-400 bg-white/5' : 'text-white'}`}
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
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search videos by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/15 rounded-xl text-white text-base font-medium placeholder:text-gray-500 focus:bg-white/10 focus:border-pink-500/50"
            />
          </div>

          {/* Category pills — bold editorial */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  category === cat.id
                    ? "bg-white text-black"
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
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full aspect-video rounded-xl" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 mb-4 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Library className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">No videos found</h3>
            <p className="text-sm text-gray-500">Try a different category or search term</p>
          </div>
        ) : grouped ? (
          /* Grouped by category — editorial sections */
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, vids]) => {
              const catLabel = CATEGORIES.find((c) => c.id === cat)?.label || cat;
              return (
                <div key={cat}>
                  {/* Section header with strong divider */}
                  <div className="flex items-end justify-between mb-4 pb-3 border-b-2 border-white/20">
                    <h2 className="text-2xl font-black text-white capitalize tracking-tight">{catLabel}</h2>
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{vids.length} videos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {vids.slice(0, 8).map((v) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {visibleVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
            {visibleCount < total && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setVisibleCount((c) => c + 48)}
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white hover:text-black font-bold px-8 py-3 rounded-lg"
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