import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Play, Search } from "lucide-react";
import { Avatar, BnmLockedScreen, EmptyState, Glass, GradientButton, Pill, SectionTitle, asItems, formatCount } from "@/components/bnm/LockedShell";

export default function BnmLockedSearch() {
  const [q, setQ] = useState("");
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnm-search-public-videos"],
    queryFn: async () => asItems(await base44.entities.Video.filter({ visibility: "public" }, "-created_date", 50)),
  });
  const query = q.trim().toLowerCase();
  const results = useMemo(() => videos.filter((v) => {
    if (!query) return true;
    return [v.title, v.description, v.channel_name, ...(v.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(query);
  }), [videos, query]);
  const creators = useMemo(() => {
    const map = new Map();
    results.forEach((v) => {
      const key = v.channel_id || v.channel_name;
      if (key && !map.has(key)) map.set(key, { id:key, name:v.channel_name || "Creator", avatar:v.channel_avatar });
    });
    return [...map.values()].slice(0,3);
  }, [results]);

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <label className="flex h-14 items-center gap-3 rounded-full border border-[#6875d1] bg-[#101f42] px-4">
          <Search className="h-6 w-6" />
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search creators, challenges, and posts" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:text-[#8798ba]" />
          {q && <button onClick={()=>setQ("")} className="rounded-full bg-[#3a4b73] px-2 text-sm">×</button>}
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]"><Pill active>All</Pill><Pill>Creators</Pill><Pill>Opportunities</Pill><Pill>Events</Pill><Pill>Posts</Pill></div>

        <section className="mt-5">
          <SectionTitle title="Creators" action={creators.length ? "See All" : null} />
          <div className="space-y-2">
            {creators.map((creator) => (
              <Glass key={creator.id} className="flex items-center gap-3 p-3">
                <Avatar src={creator.avatar} label={creator.name} size={58}/>
                <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-black">{creator.name}</div><div className="text-[10px] text-[#90a2c4]">Public creator from matching content</div><div className="mt-2"><Pill>Community</Pill></div></div>
                <Link to="/profile"><GradientButton className="px-4 py-2 text-xs">View</GradientButton></Link>
              </Glass>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <SectionTitle title={query ? "Matching Posts" : "Public Posts"} />
          {isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-[#0b1930]" /> : results.length ? (
            <div className="space-y-2 pb-4">
              {results.slice(0,8).map((v) => (
                <Glass key={v.id} className="flex gap-3 p-2.5">
                  <div className="h-[92px] w-[118px] shrink-0 overflow-hidden rounded-[14px] bg-[#122342]">
                    {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><Play className="h-8 w-8 text-[#8c69ff]"/></div>}
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="line-clamp-2 text-[14px] font-black">{v.title}</div>
                    <div className="mt-1 truncate text-[10px] text-[#9ba9c6]">{v.channel_name || "Creator"}</div>
                    <div className="mt-2 flex gap-2 text-[10px] text-[#8194b9]"><span>{formatCount(v.views)} views</span><span>•</span><span>{formatCount(v.likes)} likes</span></div>
                  </div>
                </Glass>
              ))}
            </div>
          ) : <EmptyState icon={Search} title="No matching public content" body="Try a different search. Search results are never fabricated." />}
        </section>
      </div>
    </BnmLockedScreen>
  );
}