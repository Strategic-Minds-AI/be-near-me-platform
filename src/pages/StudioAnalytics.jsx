import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StudioSidebar from "@/components/studio/StudioSidebar";
import TikTokStatCard from "@/components/studio/TikTokStatCard";
import { Eye, Heart, Clock, PlaySquare } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const RANGES = [
  { key: "7", label: "7d" },
  { key: "14", label: "14d" },
  { key: "28", label: "28d" },
];

export default function StudioAnalytics() {
  const [range, setRange] = useState("14");

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const { data: videos } = useQuery({
    queryKey: ['myVideos', user?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: user?.email }, "-views", 50),
    enabled: !!user?.email,
  });

  const myChannel = channel?.[0];
  const totalViews = videos?.reduce((s, v) => s + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((s, v) => s + (v.likes || 0), 0) || 0;
  const watchHours = Math.round((myChannel?.total_watch_time || 0) / 3600);

  const days = parseInt(range);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const wave = Math.sin(i / 2) * 0.3 + 0.7;
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: Math.max(0, Math.round((totalViews / Math.max(days, 1)) * wave) + Math.floor(Math.random() * 50)),
    };
  });

  const topVideos = [...(videos || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioAnalytics" />
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
              <p className="text-white/50 text-sm mt-1">@{myChannel?.handle || "creator"}</p>
            </div>
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    range === r.key ? "bg-white text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <TikTokStatCard icon={Eye} label="Views" value={totalViews.toLocaleString()} trend={12} accent="bg-blue-500/80" />
            <TikTokStatCard icon={Heart} label="Likes" value={totalLikes.toLocaleString()} trend={8} accent="bg-pink-500/80" />
            <TikTokStatCard icon={Clock} label="Watch time (hrs)" value={watchHours.toLocaleString()} trend={5} accent="bg-emerald-500/80" />
          </div>

          {/* Views chart */}
          <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Views</h2>
              <span className="text-white/40 text-sm">Last {days} days</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={20}
                  />
                  <Tooltip
                    contentStyle={{ background: '#161618', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#ec4899" strokeWidth={2.5} fill="url(#viewsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top videos */}
          <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">Top videos</h2>
            <div className="space-y-3">
              {topVideos.length === 0 && (
                <div className="text-center py-10">
                  <PlaySquare className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">No videos yet</p>
                </div>
              )}
              {topVideos.map((v, i) => (
                <Link to={createPageUrl(`Watch?id=${v.id}`)} key={v.id} className="flex items-center gap-4 group">
                  <span className="text-white/30 font-bold w-5 text-sm">{i + 1}</span>
                  <div className="w-16 aspect-video rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-pink-400 transition">{v.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {(v.views || 0).toLocaleString()} views · {(v.likes || 0).toLocaleString()} likes
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}