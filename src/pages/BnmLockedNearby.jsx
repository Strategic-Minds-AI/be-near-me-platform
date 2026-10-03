import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Compass, Heart, Leaf, MapPin, PawPrint, Search, Sparkles, Users, ChevronRight } from "lucide-react";
import { BnmLockedScreen, EmptyState, Glass, Pill, SectionTitle, asItems, formatCount } from "@/components/bnm/LockedShell";

export default function BnmLockedNearby() {
  const [locationState, setLocationState] = useState("idle");
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["bnm-lock-community-posts"],
    queryFn: async () => asItems(await base44.entities.CommunityPost.filter({ visibility: "public" }, "-created_date", 30)),
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
    <BnmLockedScreen>
      <section className="relative overflow-hidden border-y border-[#223b65] bg-[#061327]">
        <div className="px-4 pt-3">
          <label className="flex h-12 items-center gap-3 rounded-full border border-[#6676d9] bg-[#122047] px-4">
            <Search className="h-5 w-5" />
            <span className="text-sm text-[#a9b8d7]">Search by cause, location, or activity…</span>
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
            <Pill active>All</Pill><Pill><Leaf className="h-3 w-3" /> Environment</Pill><Pill><Users className="h-3 w-3" /> People</Pill><Pill><PawPrint className="h-3 w-3" /> Animals</Pill><Pill><Heart className="h-3 w-3" /> Kindness</Pill>
          </div>
        </div>

        <div className="relative mt-1 h-[330px] overflow-hidden bg-[#07172c]">
          <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(73,112,176,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(73,112,176,.18)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute -left-8 top-20 h-28 w-[115%] rotate-[-8deg] rounded-[50%] border-[18px] border-[#103762]/70" />
          <div className="absolute inset-x-0 top-[42%] text-center text-[23px] font-black tracking-[.22em] text-[#8497c4]/75">NEAR YOU</div>

          {locationState === "enabled" ? (
            <div className="absolute left-[48%] top-[54%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3979ff]/25 ring-1 ring-[#5fa0ff]">
              <span className="absolute inset-[14px] rounded-full bg-[#2a75ff] ring-4 ring-white" />
            </div>
          ) : (
            <button onClick={enableLocation} disabled={locationState === "loading"} className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full border border-[#6e75d8] bg-[#111f47]/95 px-4 py-2 text-xs font-black shadow-[0_0_30px_rgba(88,77,255,.2)]">
              <MapPin className="mr-1 inline h-4 w-4 text-[#b987ff]" />
              {locationState === "loading" ? "Requesting…" : locationState === "denied" ? "Location blocked" : locationState === "unsupported" ? "Location unavailable" : "Enable location"}
            </button>
          )}

          <div className="absolute right-4 top-20 grid gap-3">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#304c77] bg-[#0a1831]/95"><Compass className="h-5 w-5" /></button>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#304c77] bg-[#0a1831]/95"><Sparkles className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      <section className="-mt-3 rounded-t-[26px] border-t border-[#2a426c] bg-[#041022] px-3 pb-6 pt-5">
        <SectionTitle title="Nearby Today" action="See All" href="/search" />
        <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none]"><Pill active>Community</Pill><Pill>Volunteer</Pill><Pill>Creator Activity</Pill></div>
        {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-[#0b1930]" /> :
          posts.length ? (
            <div className="space-y-2">
              {posts.slice(0,4).map((post) => (
                <Glass key={post.id} className="flex gap-3 p-2.5">
                  <div className="h-[84px] w-[96px] shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#16426d] to-[#361945]">
                    {post.image_url ? <img src={post.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Heart className="h-8 w-8 text-[#ff4bb6]" /></div>}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="text-[9px] font-black uppercase tracking-[.08em] text-[#59c6ff]">{post.type || "community"}</div>
                    <div className="mt-1 line-clamp-2 text-[13px] font-black">{post.content || "Community update"}</div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-[#94a5c7]">
                      <span>{post.channel_name || "Be Near Me"}</span><span>•</span><span>{formatCount(post.likes)} likes</span>
                    </div>
                  </div>
                  <ChevronRight className="mt-8 h-5 w-5 text-[#83a0c7]" />
                </Glass>
              ))}
            </div>
          ) : <EmptyState icon={Users} title="No nearby public activity yet" body="When public community posts are available, they appear here. Your location is never invented." />
        }
      </section>
    </BnmLockedScreen>
  );
}