import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Compass, Heart, Leaf, MapPin, PawPrint, Search, SlidersHorizontal, Sparkles, Users, Utensils, ChevronRight
} from "lucide-react";
import {
  BnmLockedScreen, EmptyState, Glass, Pill, SectionTitle, asItems, formatCount
} from "@/components/bnm/LockedShell";

export default function BnmLockedNearby() {
  const [locationState, setLocationState] = useState("idle");
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["bnm-lock-community-posts-v2"],
    queryFn: async () => asItems(await base44.entities.CommunityPost.filter({ visibility: "public" }, "-created_date", 40)),
  });

  const enableLocation = () => {
    if (!navigator.geolocation) return setLocationState("unsupported");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      () => setLocationState("enabled"),
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <BnmLockedScreen activeSection="Nearby">
      <section className="border-y border-[#223b65] bg-[#061327]">
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2">
            <label className="flex h-11 flex-1 items-center gap-3 rounded-full border border-[#536fbb] bg-[#101f43] px-4">
              <Search className="h-4.5 w-4.5 text-[#a6b8dc]" />
              <span className="truncate text-[11px] font-semibold text-[#9eb0d2]">Search by cause, location, or activity…</span>
            </label>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#405d8c] bg-[#0d1c38]" aria-label="Filters">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none]">
            <Pill active>All</Pill>
            <Pill><Leaf className="h-3 w-3" /> Environment</Pill>
            <Pill><Users className="h-3 w-3" /> People</Pill>
            <Pill><PawPrint className="h-3 w-3" /> Animals</Pill>
            <Pill><Utensils className="h-3 w-3" /> Food</Pill>
          </div>
        </div>

        <div className="relative h-[330px] overflow-hidden border-t border-[#1b3258] bg-[#07172c]">
          <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(76,118,187,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(76,118,187,.14)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -left-16 top-[70px] h-32 w-[560px] rotate-[-10deg] rounded-[50%] border-[16px] border-[#173b62]/80" />
          <div className="absolute -left-4 top-[205px] h-24 w-[470px] rotate-[12deg] rounded-[50%] border-[11px] border-[#102f53]/70" />
          <div className="absolute left-[31%] top-[42%] text-[10px] font-black tracking-[.2em] text-[#6e86af]/70">{locationState === "enabled" ? "YOUR LOCATION" : "LOCATION OFF"}</div>

          {locationState === "enabled" ? (
            <div className="absolute left-[49%] top-[54%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#377aff]/20 ring-1 ring-[#5da0ff]/80">
              <span className="absolute inset-[16px] rounded-full bg-[#2c78ff] ring-[5px] ring-white shadow-[0_0_18px_rgba(64,129,255,.8)]" />
            </div>
          ) : (
            <button
              onClick={enableLocation}
              disabled={locationState === "loading"}
              className="absolute left-1/2 top-[52%] -translate-x-1/2 rounded-full border border-[#7867d9] bg-[#111f47]/95 px-4 py-2 text-[10px] font-black shadow-[0_0_30px_rgba(88,77,255,.2)]"
            >
              <MapPin className="mr-1 inline h-4 w-4 text-[#c48dff]" />
              {locationState === "loading" ? "Requesting…" : locationState === "denied" ? "Location blocked" : locationState === "unsupported" ? "Location unavailable" : "Use My Location"}
            </button>
          )}

          <div className="absolute right-3 top-4 grid gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-[#304c77] bg-[#0a1831]/95"><Compass className="h-4.5 w-4.5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-[#304c77] bg-[#0a1831]/95"><Sparkles className="h-4.5 w-4.5" /></button>
          </div>

          <div className="absolute bottom-3 left-3 rounded-full border border-[#314b75] bg-[#07162e]/90 px-3 py-1.5 text-[9px] font-bold text-[#b8c7e4]">
            {locationState === "enabled" ? "Your position is shown privately" : "Location permission required for distance sorting"}
          </div>
        </div>
      </section>

      <section className="-mt-3 rounded-t-[26px] border-t border-[#2a426c] bg-[#041022] px-3 pb-6 pt-4 shadow-[0_-15px_35px_rgba(2,7,18,.45)]">
        <SectionTitle title="Nearby Today" action={posts.length ? "See All" : null} href="/search" />
        <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          <Pill active>Community Challenges</Pill>
          <Pill>Volunteer Moments</Pill>
          <Pill>Creator Activity</Pill>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i)=><div key={i} className="h-[92px] animate-pulse rounded-[16px] bg-[#0b1930]" />)}
          </div>
        ) : posts.length ? (
          <div className="space-y-2">
            {posts.slice(0,5).map((post) => (
              <Glass key={post.id} className="flex gap-2.5 p-2">
                <div className="h-[76px] w-[96px] shrink-0 overflow-hidden rounded-[12px] bg-gradient-to-br from-[#16426d] to-[#361945]">
                  {post.image_url ? <img src={post.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Heart className="h-7 w-7 text-[#ff4bb6]" /></div>}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="text-[8px] font-black uppercase tracking-[.08em] text-[#59c6ff]">{post.type || "community"}</div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] font-black leading-4">{post.content || "Community update"}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-[#94a5c7]">
                    <span className="truncate">{post.channel_name || "Be Near Me"}</span><span>•</span><span>{formatCount(post.likes)} likes</span>
                  </div>
                </div>
                <ChevronRight className="mt-7 h-4.5 w-4.5 text-[#83a0c7]" />
              </Glass>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[1,2,3,4].map((i) => (
              <Glass key={i} className="flex items-center gap-2.5 p-2">
                <div className="grid h-[76px] w-[96px] shrink-0 place-items-center rounded-[12px] border border-[#20395f] bg-[linear-gradient(135deg,#102745,#141932_55%,#28172f)]">
                  {i === 1 ? <Leaf className="h-6 w-6 text-[#5acfa9]" /> : i === 2 ? <Users className="h-6 w-6 text-[#8d74df]" /> : i === 3 ? <Heart className="h-6 w-6 text-[#e4589f]" /> : <PawPrint className="h-6 w-6 text-[#5da8df]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-[78%] rounded-full bg-[#1a2c49]" />
                  <div className="mt-2 h-2.5 w-[58%] rounded-full bg-[#14243e]" />
                  <div className="mt-2 flex gap-1.5">
                    <span className="h-5 w-16 rounded-full border border-[#314b74] bg-[#0d1b34]" />
                    <span className="h-5 w-12 rounded-full border border-[#314b74] bg-[#0d1b34]" />
                  </div>
                </div>
                <button disabled className="rounded-full border border-[#3f5982] bg-[#101f3a] px-3 py-2 text-[8px] font-black text-[#788bac]">Join</button>
              </Glass>
            ))}
            <p className="px-2 pt-1 text-center text-[8px] leading-4 text-[#7588aa]">Verified nearby activity will replace these structural placeholders. No fake events, distances, attendance, or businesses.</p>
          </div>
        )}
      </section>
    </BnmLockedScreen>
  );
}
