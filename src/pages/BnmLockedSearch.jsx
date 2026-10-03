import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CalendarDays, MapPin, Play, Search, Users } from "lucide-react";
import {
  Avatar, BnmLockedScreen, EmptyState, Glass, GradientButton, Pill, SectionTitle, asItems, formatCount
} from "@/components/bnm/LockedShell";

const isProductionContent = (video) => {
  const tags = (video?.tags || []).map((tag) => String(tag).toLowerCase());
  return Boolean(video?.channel_id) && !tags.some((tag) => ["seed", "scraped", "youtube"].includes(tag));
};

export default function BnmLockedSearch() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const { data: rawVideos = [], isLoading } = useQuery({
    queryKey: ["bnm-search-public-videos-v2"],
    queryFn: async () => asItems(await base44.entities.Video.filter({ visibility: "public" }, "-created_date", 80)),
  });

  const videos = useMemo(() => rawVideos.filter(isProductionContent), [rawVideos]);
  const query = q.trim().toLowerCase();

  const results = useMemo(() => videos.filter((v) => {
    if (!query) return true;
    return [v.title, v.description, v.channel_name, ...(v.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  }), [videos, query]);

  const creators = useMemo(() => {
    const map = new Map();
    results.forEach((v) => {
      const key = v.channel_id || v.channel_name;
      if (key && !map.has(key)) {
        map.set(key, { id: key, name: v.channel_name || "Creator", avatar: v.channel_avatar, posts: 0, views: 0 });
      }
      const item = map.get(key);
      if (item) {
        item.posts += 1;
        item.views += Number(v.views || 0);
      }
    });
    return [...map.values()].slice(0, 4);
  }, [results]);

  const showCreators = filter === "All" || filter === "Creators";
  const showPosts = filter === "All" || filter === "Posts";
  const showOpportunities = filter === "All" || filter === "Opportunities";
  const showEvents = filter === "All" || filter === "Events";

  return (
    <BnmLockedScreen activeSection="Nearby">
      <div className="px-3 pt-3">
        <label className="flex h-13 items-center gap-3 rounded-full border border-[#6875d1] bg-[#101f42] px-4">
          <Search className="h-5 w-5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, challenges, and posts"
            className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:text-[#8798ba]"
          />
          {q ? <button onClick={() => setQ("")} className="grid h-7 w-7 place-items-center rounded-full bg-[#33496f] text-xs">×</button> : null}
        </label>

        <div className="mt-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {["All","Creators","Opportunities","Events","Posts"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black " +
                (filter === item
                  ? "border-[#3fb8ff] bg-gradient-to-r from-[#2f8fff] to-[#d43dff] text-white"
                  : "border-[#35517c] bg-[#0a1832] text-[#aebddd]")
              }
            >
              {item}
            </button>
          ))}
        </div>

        {showCreators ? (
          <section className="mt-5">
            <SectionTitle title="Creators" action={creators.length > 3 ? "See All" : null} />
            {creators.length ? (
              <div className="space-y-2">
                {creators.slice(0, 3).map((creator) => (
                  <Glass key={creator.id} className="flex items-center gap-3 p-3">
                    <Avatar src={creator.avatar} label={creator.name} size={54} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-black">{creator.name}</div>
                      <div className="mt-0.5 text-[9px] text-[#8fa2c2]">{creator.posts} public post{creator.posts === 1 ? "" : "s"} • {formatCount(creator.views)} views</div>
                      <div className="mt-1.5"><Pill>Community Creator</Pill></div>
                    </div>
                    <Link to={"/profile?channel=" + encodeURIComponent(creator.id)}>
                      <GradientButton className="px-4 py-2 text-[10px]">View</GradientButton>
                    </Link>
                  </Glass>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[1,2].map((i) => (
                  <Glass key={i} className="flex items-center gap-3 p-3">
                    <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-[#3d5780] bg-[#101c36]">
                      <Users className="h-5 w-5 text-[#846cce]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-[72%] rounded-full bg-[#1b2d49]" />
                      <div className="mt-2 h-2.5 w-[54%] rounded-full bg-[#14243e]" />
                      <div className="mt-2 h-5 w-24 rounded-full border border-[#314b74] bg-[#0d1b34]" />
                    </div>
                    <button disabled className="rounded-full border border-[#3d5882] bg-[#101f3a] px-4 py-2 text-[9px] font-black text-[#7588aa]">Follow</button>
                  </Glass>
                ))}
                <p className="px-2 pt-1 text-center text-[8px] leading-4 text-[#7588aa]">Verified creator records replace these structural slots. Seed and scraped donor channels remain excluded.</p>
              </div>
            )}
          </section>
        ) : null}

        {showOpportunities ? (
          <section className="mt-5">
            <SectionTitle title="Local Opportunities" />
            <div className="space-y-2">
              {[1,2].map((i) => (
                <Glass key={i} className="flex items-center gap-3 p-3">
                  <div className="grid h-14 w-16 shrink-0 place-items-center rounded-[13px] border border-[#213b61] bg-[linear-gradient(135deg,#102745,#151934_55%,#26172d)]"><MapPin className="h-5 w-5 text-[#5ed6ff]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-[84%] rounded-full bg-[#1b2d49]" />
                    <div className="mt-2 h-2.5 w-[62%] rounded-full bg-[#14243e]" />
                    <div className="mt-2 flex gap-1.5"><span className="h-5 w-16 rounded-full border border-[#314b74] bg-[#0d1b34]" /><span className="h-5 w-12 rounded-full border border-[#314b74] bg-[#0d1b34]" /></div>
                  </div>
                  <button disabled className="rounded-full border border-[#3d5882] bg-[#101f3a] px-3 py-2 text-[9px] font-black text-[#7588aa]">Join</button>
                </Glass>
              ))}
              <p className="px-2 text-center text-[8px] leading-4 text-[#7588aa]">No Opportunity entity is connected yet; these rows preserve the approved result geometry only.</p>
            </div>
          </section>
        ) : null}

        {showEvents ? (
          <section className="mt-5">
            <SectionTitle title="Community Events" />
            <div className="space-y-2">
              {[1,2].map((i) => (
                <Glass key={i} className="flex items-center gap-3 p-3">
                  <div className="grid h-14 w-16 shrink-0 place-items-center rounded-[13px] border border-[#312f67] bg-[linear-gradient(135deg,#171b42,#26183e_55%,#35172f)]"><CalendarDays className="h-5 w-5 text-[#b97bff]" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-[78%] rounded-full bg-[#1b2d49]" />
                    <div className="mt-2 h-2.5 w-[48%] rounded-full bg-[#14243e]" />
                  </div>
                  <button disabled className="rounded-full border border-[#3d5882] bg-[#101f3a] px-3 py-2 text-[9px] font-black text-[#7588aa]">Interested</button>
                </Glass>
              ))}
              <p className="px-2 text-center text-[8px] leading-4 text-[#7588aa]">Verified community-event records replace these structural slots when a real source exists.</p>
            </div>
          </section>
        ) : null}

        {showPosts ? (
          <section className="mt-5 pb-4">
            <SectionTitle title={query ? "Matching Posts" : "Posts"} />
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map((i)=><div key={i} className="h-[92px] animate-pulse rounded-[16px] bg-[#0b1930]" />)}</div>
            ) : results.length ? (
              <div className="space-y-2">
                {results.slice(0, 8).map((v) => (
                  <Glass key={v.id} className="flex gap-3 p-2">
                    <div className="h-[84px] w-[110px] shrink-0 overflow-hidden rounded-[12px] bg-[#122342]">
                      {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Play className="h-7 w-7 text-[#8c69ff]" /></div>}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="line-clamp-2 text-[12px] font-black leading-4">{v.title}</div>
                      <div className="mt-1 truncate text-[9px] text-[#9ba9c6]">{v.channel_name || "Creator"}</div>
                      <div className="mt-2 flex gap-2 text-[9px] text-[#8194b9]">
                        <span>{formatCount(v.views)} views</span><span>•</span><span>{formatCount(v.likes)} likes</span>
                      </div>
                    </div>
                  </Glass>
                ))}
              </div>
            ) : (
              <EmptyState icon={Search} title="No verified posts match" body="Try another search or create the first Be Near Me post." />
            )}
          </section>
        ) : null}
      </div>
    </BnmLockedScreen>
  );
}
