import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin, Play, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmHeader, BnmPage, BnmSearchField } from "@/components/bnm/BnmChrome";

const categoryTiles = [
  { label: "Trending Now", sub: "Trending", image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80", to: null },
  { label: "Nearby", sub: "Live near you", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", to: "/nearby" },
  { label: "Food & Drinks", sub: "Food", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", to: null },
  { label: "Travel", sub: "Travel", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", to: null },
  { label: "Events", sub: "Events", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", to: null },
  { label: "Creators", sub: "Creators", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80", to: null },
];

export default function BnmDiscover() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnmDiscoverVideos"],
    queryFn: async () => {
      const result = await base44.entities.Video.filter({ visibility: "public" }, { sort: "-created_date", limit: 12 });
      return result?.items || result || [];
    },
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
    if (normalized) navigate("/Search?q=" + encodeURIComponent(normalized));
  };

  return (
    <BnmPage>
      <BnmHeader title="Discover" brand />
      <main className="mx-auto max-w-md px-4 pt-4">
        <form onSubmit={submitSearch}>
          <BnmSearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, places, or sounds..."
          />
        </form>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          {categoryTiles.map(({ sub }) => {
            const active = activeCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveCategory(sub)}
                className={
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition " +
                  (active
                    ? "border-fuchsia-400/60 bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff] text-white"
                    : "border-white/10 bg-white/[0.045] text-[#aeb8cc] hover:bg-white/[0.08]")
                }
              >
                {sub}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {categoryTiles.map(({ label, sub, image, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => (to ? navigate(to) : setActiveCategory(sub))}
              className="group relative aspect-[4/3] overflow-hidden rounded-[20px] border border-white/10 text-left"
            >
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition group-active:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-3">
                <p className="text-sm font-extrabold text-white">{label}</p>
                <p className="text-xs text-white/70">{sub === "Nearby" ? "Live near you" : "Trending content"}</p>
              </div>
            </button>
          ))}
        </div>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-white">Explore</h2>
            <span className="text-xs text-[#7f899e]">
              {isLoading ? "Loading" : visibleVideos.length ? "Live content" : "No content yet"}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] animate-pulse rounded-[22px] border border-white/10 bg-white/[0.04]" />
              ))}
            </div>
          ) : visibleVideos.length ? (
            <div className="grid grid-cols-2 gap-3">
              {visibleVideos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => navigate("/Watch?v=" + encodeURIComponent(video.id))}
                  className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#0d121d] text-left"
                >
                  <div className="relative aspect-[3/4] bg-[#0a0f19]">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Play className="h-9 w-9 text-[#68758f]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {video.title ? (
                      <p className="absolute inset-x-3 bottom-3 line-clamp-2 text-sm font-bold text-white">{video.title}</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Trending", Sparkles],
                ["Nearby", MapPin],
                ["Discover", Compass],
                ["Creators", Sparkles],
              ].map(([label, Icon]) => (
                <div key={label} className="flex aspect-[3/4] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-[#0d121d]">
                  <Icon className="h-9 w-9 text-[#66728a]" strokeWidth={1.6} />
                  <p className="mt-4 text-sm font-bold text-white">{label}</p>
                  <p className="mt-1 text-xs text-[#768197]">Content will appear here</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </BnmPage>
  );
}