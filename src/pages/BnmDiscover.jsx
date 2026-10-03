import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Compass, MapPin, Play, Sparkles, Users, Utensils, Plane } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmHeader, BnmPage, BnmSearchField } from "@/components/bnm/BnmChrome";

const categoryTiles = [
  { label: "Trending", Icon: Sparkles, to: null },
  { label: "Nearby", Icon: MapPin, to: "/nearby" },
  { label: "Food", Icon: Utensils, to: null },
  { label: "Travel", Icon: Plane, to: null },
  { label: "Events", Icon: CalendarDays, to: null },
  { label: "Creators", Icon: Users, to: null },
];

export default function BnmDiscover() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Trending");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnmDiscoverVideos"],
    queryFn: async () => {
      const result = await base44.entities.Video.filter(
        { visibility: "public" },
        { sort: "-created_date", limit: 12 }
      );
      return Array.isArray(result) ? result : result?.items || [];
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
    if (normalized) navigate("/search?q=" + encodeURIComponent(normalized));
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
          {categoryTiles.map(({ label, to }) => {
            const active = activeCategory === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setActiveCategory(label);
                  if (to) navigate(to);
                }}
                className={
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition " +
                  (active
                    ? "border-fuchsia-400/60 bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff] text-white"
                    : "border-white/10 bg-white/[0.045] text-[#aeb8cc] hover:bg-white/[0.08]")
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {categoryTiles.map(({ label, Icon, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setActiveCategory(label);
                if (to) navigate(to);
              }}
              className="group flex aspect-[4/3] flex-col items-center justify-center rounded-[20px] border border-white/10 bg-[#0d121d] text-center transition active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <Icon className="h-6 w-6 text-[#7d89a0]" strokeWidth={1.6} />
              </div>
              <p className="mt-3 text-sm font-extrabold text-white">{label}</p>
              <p className="mt-1 text-[11px] text-[#768197]">Real content appears here</p>
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
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[24px] border border-white/10 bg-[#0d121d] px-8 text-center">
              <Compass className="h-10 w-10 text-[#657189]" strokeWidth={1.6} />
              <h3 className="mt-4 text-base font-extrabold text-white">Nothing to show yet</h3>
              <p className="mt-2 text-sm leading-6 text-[#7e899f]">Public videos will appear here when real content is available.</p>
            </div>
          )}
        </section>
      </main>
    </BnmPage>
  );
}

