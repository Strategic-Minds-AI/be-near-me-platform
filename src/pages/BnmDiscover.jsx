import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  MapPin,
  Play,
  Search,
  Sparkles,
  Users,
  Utensils,
  Plane,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  Pill,
  asItems,
} from "@/components/bnm/LockedShell";

const categoryTiles = [
  { label: "Trending", Icon: Sparkles, to: null },
  { label: "Nearby", Icon: MapPin, to: "/nearby" },
  { label: "Food", Icon: Utensils, to: null },
  { label: "Travel", Icon: Plane, to: null },
  { label: "Events", Icon: CalendarDays, to: null },
  { label: "Creators", Icon: Users, to: "/creator-studio" },
];

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmDiscover() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnmDiscoverVideosV2"],
    queryFn: async () =>
      asItems(
        await base44.entities.Video.filter(
          { visibility: "public" },
          { sort: "-created_date", limit: 24 }
        )
      ).filter(isProductionContent),
  });

  const visibleVideos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return videos;
    return videos.filter((video) =>
      [video.title, video.description, video.category, ...(video.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [query, videos]);

  const submitSearch = (event) => {
    event.preventDefault();
    const normalized = query.trim();
    if (normalized) navigate("/search?q=" + encodeURIComponent(normalized));
  };

  return (
    <BnmLockedScreen activeSection="Nearby">
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Discover</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Explore Near You
          </h1>
          <form onSubmit={submitSearch} className="mt-3">
            <div className="flex items-center gap-2 rounded-full border border-[#35517c] bg-[#0a1832] px-3">
              <Search className="h-4 w-4 text-[#7184a8]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 100))}
                placeholder="Search people, places, or activities"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />
            </div>
          </form>
        </Glass>

        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {categoryTiles.map(({ label, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setActiveCategory(label);
                if (to) navigate(to);
              }}
            >
              <Pill active={activeCategory === label}>{label}</Pill>
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {categoryTiles.map(({ label, Icon, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setActiveCategory(label);
                if (to) navigate(to);
              }}
              className="min-w-0"
            >
              <Glass className="flex aspect-[4/3] flex-col items-center justify-center p-3 text-center">
                <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#10213e]">
                  <Icon className="h-5 w-5 text-[#a38bff]" />
                </div>
                <p className="mt-2 text-[12px] font-black text-white">{label}</p>
                <p className="mt-1 text-[9px] text-[#7587a8]">Real content only</p>
              </Glass>
            </button>
          ))}
        </div>

        <section className="pb-4 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-black text-white">Explore</h2>
            <span className="text-[10px] text-[#8092b3]">
              {isLoading ? "Loading" : visibleVideos.length ? "Live content" : "No content yet"}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse rounded-[20px] border border-[#263e68] bg-[#08162b]"
                />
              ))}
            </div>
          ) : visibleVideos.length ? (
            <div className="grid grid-cols-2 gap-2">
              {visibleVideos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => navigate("/watch?v=" + encodeURIComponent(video.id))}
                  className="min-w-0 text-left"
                >
                  <Glass className="overflow-hidden">
                    <div className="relative aspect-[3/4] bg-[#071226]">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <Play className="h-8 w-8 text-[#8d6cff]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <p className="absolute inset-x-2 bottom-2 line-clamp-2 text-[11px] font-black text-white">
                        {video.title || "Video"}
                      </p>
                    </div>
                  </Glass>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="Nothing to show yet"
              body="Real public videos will appear here when they are available."
            />
          )}
        </section>
      </div>
    </BnmLockedScreen>
  );
}
