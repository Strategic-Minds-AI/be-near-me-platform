import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Film,
  Activity,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fmt = (n) => (n == null ? 0 : Number(n).toLocaleString());

function Tile({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
        <Icon className={`w-4 h-4 ${accent}`} /> {label}
      </div>
      <p className="text-2xl font-bold text-white">{fmt(value)}</p>
    </div>
  );
}

export default function DashboardSummary({ email, isAdmin }) {
  const totalsQ = useQuery({
    queryKey: ["videoTotalsAll", email],
    queryFn: () =>
      base44.entities.Video.aggregate({
        query: { created_by: email },
        sum: ["views", "likes", "comments_count"],
      }),
    enabled: !!email,
  });

  const gaQ = useQuery({
    queryKey: ["gaSummary"],
    queryFn: async () => {
      try {
        const r = await base44.functions.invoke("googleAnalyticsTraffic", {});
        return r.data;
      } catch (e) {
        throw new Error(e.response?.data?.error || e.message);
      }
    },
    enabled: !!isAdmin,
    refetchInterval: 30000,
  });

  const row = totalsQ.data?.rows?.[0] || {};
  const totalViews = row.sum_views || 0;
  const totalLikes = row.sum_likes || 0;
  const totalComments = row.sum_comments_count || 0;
  const videoCount = row.count || 0;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Engagement Summary</h2>
          <p className="text-xs text-gray-400">
            Total views across all your uploaded videos + real-time engagement
          </p>
        </div>
      </div>

      {totalsQ.isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile icon={Eye} label="Total views" value={totalViews} accent="text-pink-400" />
          <Tile icon={ThumbsUp} label="Total likes" value={totalLikes} accent="text-fuchsia-400" />
          <Tile icon={MessageSquare} label="Total comments" value={totalComments} accent="text-pink-400" />
          <Tile icon={Film} label="Videos" value={videoCount} accent="text-fuchsia-400" />
        </div>
      )}

      {isAdmin && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-pink-400" />
            <h3 className="font-medium text-white text-sm">
              Real-time engagement (Google Analytics)
            </h3>
          </div>
          {gaQ.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
            </div>
          ) : gaQ.error ? (
            /No GA4 properties/i.test(gaQ.error.message) ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>
                  No GA4 property yet — create one in Google Analytics, then real-time
                  engagement will appear here.
                </span>
              </div>
            ) : (
              <p className="text-red-400 text-sm">{gaQ.error.message}</p>
            )
          ) : gaQ.data ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Tile
                  icon={Activity}
                  label="Active users (now)"
                  value={gaQ.data.realtime?.activeUsers}
                  accent="text-pink-400"
                />
                <Tile
                  icon={TrendingUp}
                  label="Events (now)"
                  value={gaQ.data.realtime?.eventCount}
                  accent="text-fuchsia-400"
                />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gaQ.data.trend || []}>
                    <defs>
                      <linearGradient id="gaSum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF0080" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#FF0080" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#FF0080"
                      fill="url(#gaSum)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}