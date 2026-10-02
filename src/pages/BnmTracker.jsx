import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmPage, BnmHeader } from "@/components/bnm/BnmChrome";
import { Link } from "react-router-dom";
import {
  Loader2,
  Eye,
  Heart,
  Film,
  TrendingUp,
  BarChart3,
  Wand2,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

function formatNum(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function BnmTracker() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["myGeneratedVideos", user?.email],
    queryFn: async () => {
      const res = await base44.entities.Video.filter(
        { created_by: user.email },
        { sort: "-published_at", limit: 50 }
      );
      const items = res?.items || [];
      // Only show AI-generated / template videos
      return items.filter(
        (v) => v.tags?.includes("ai_generated") || v.tags?.includes("template")
      );
    },
    enabled: !!user?.email,
  });

  const stats = React.useMemo(() => {
    if (!videos) return { total: 0, views: 0, likes: 0, avgViews: 0 };
    const total = videos.length;
    const views = videos.reduce((s, v) => s + (v.views || 0), 0);
    const likes = videos.reduce((s, v) => s + (v.likes || 0), 0);
    return { total, views, likes, avgViews: total ? Math.round(views / total) : 0 };
  }, [videos]);

  const chartData = React.useMemo(() => {
    if (!videos) return [];
    return videos.slice(0, 10).map((v) => ({
      name: v.title?.slice(0, 12) || "Video",
      views: v.views || 0,
    }));
  }, [videos]);

  if (!user) {
    return (
      <BnmPage>
        <BnmHeader title="Tracker" brand />
        <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
          <BarChart3 className="h-10 w-10 text-[#8f9ab0]" />
          <p className="mt-3 text-sm text-[#8f9ab0]">Sign in to track your videos.</p>
        </div>
      </BnmPage>
    );
  }

  return (
    <BnmPage>
      <BnmHeader title="Tracker" brand />

      {/* Stats overview */}
      <div className="px-5 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={Film}
            label="Videos"
            value={stats.total}
            color="text-fuchsia-400"
          />
          <StatCard
            icon={Eye}
            label="Total views"
            value={formatNum(stats.views)}
            color="text-cyan-400"
          />
          <StatCard
            icon={Heart}
            label="Total likes"
            value={formatNum(stats.likes)}
            color="text-pink-400"
          />
        </div>
      </div>

      {/* Performance chart */}
      {chartData.length > 0 && (
        <div className="px-5 pb-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-fuchsia-400" />
              <p className="text-sm font-bold text-white">Views per video</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#788399", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0c14",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#ec4899" : "#06b6d4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Video list */}
      <div className="px-5 pb-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#8f9ab0]">
          Your generated videos
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
          </div>
        ) : videos?.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Wand2 className="mx-auto h-8 w-8 text-[#8f9ab0]" />
            <p className="mt-3 text-sm text-[#8f9ab0]">
              No generated videos yet. Create your first viral video!
            </p>
            <Link
              to="/create"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              <Wand2 className="h-4 w-4" /> Create a video
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {videos?.map((v) => {
              const templateTag = v.tags?.find((t) => t !== "ai_generated" && t !== "template");
              return (
                <Link
                  key={v.id}
                  to="/home"
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-fuchsia-500/30 hover:bg-white/[0.06]"
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-black">
                    {v.thumbnail_url ? (
                      <img
                        src={v.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[8px] font-bold text-white">
                      {v.duration || 6}s
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-white">
                      {v.title}
                    </p>
                    {templateTag && (
                      <p className="mt-0.5 text-[10px] capitalize text-fuchsia-400">
                        {templateTag.replace(/-/g, " ")}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#788399]">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {formatNum(v.views)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {formatNum(v.likes)}
                      </span>
                      <span>{timeAgo(v.published_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </BnmPage>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="mt-1.5 text-xl font-extrabold text-white">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#788399]">
        {label}
      </p>
    </div>
  );
}