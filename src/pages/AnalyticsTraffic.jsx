import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Activity,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  Gauge,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fmtNum = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtSec = (s) => {
  const sec = Math.round(Number(s || 0));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
        <Icon className={`w-4 h-4 ${accent}`} /> {label}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function AnalyticsTraffic() {
  const [propertyId, setPropertyId] = useState("");

  const userQ = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const user = userQ.data;

  const trafficQ = useQuery({
    queryKey: ["gaTraffic", propertyId],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("googleAnalyticsTraffic", { propertyId });
        return res.data;
      } catch (e) {
        throw new Error(e.response?.data?.error || e.message);
      }
    },
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (trafficQ.data?.selectedPropertyId && !propertyId) {
      setPropertyId(trafficQ.data.selectedPropertyId);
    }
  }, [trafficQ.data, propertyId]);

  if (userQ.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>;
  }
  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertCircle className="w-10 h-10 text-pink-500" />
        <p className="text-gray-300">Platform analytics is admin-only.</p>
      </div>
    );
  }

  const data = trafficQ.data;
  const err = trafficQ.error?.message;
  const noProperties = err && /No GA4 properties/i.test(err);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Gauge className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
          <p className="text-sm text-gray-400">Real-time traffic & engagement from Google Analytics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => trafficQ.refetch()}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${trafficQ.isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-2 mb-6 text-xs text-gray-400">
        <Activity className="w-4 h-4 text-pink-400" /> Auto-refreshes every 30s
      </div>

      {trafficQ.isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
      ) : noProperties ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200">
          <div className="flex items-center gap-2 font-semibold mb-2"><AlertCircle className="w-5 h-5" /> No GA4 properties found</div>
          <p className="text-sm text-amber-100/80">
            The connected Google account doesn't have any GA4 properties yet. Create one in
            {" "}<a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="underline">Google Analytics</a>{" "}
            (Admin → Create property), add the BeNearMe data stream, then refresh here.
          </p>
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          <div className="flex items-center gap-2 font-semibold mb-2"><AlertCircle className="w-5 h-5" /> Error</div>
          <p className="text-sm">{err}</p>
        </div>
      ) : data ? (
        <>
          {data.properties?.length > 1 && (
            <div className="mb-6">
              <Select value={data.selectedPropertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="w-full max-w-sm bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  {data.properties.map((p) => (
                    <SelectItem key={p.propertyId} value={p.propertyId}>
                      {p.displayName} · {p.account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Activity} label="Active users (now)" value={fmtNum(data.realtime?.activeUsers)} accent="text-pink-400" />
            <StatCard icon={TrendingUp} label="Events (now)" value={fmtNum(data.realtime?.eventCount)} accent="text-fuchsia-400" />
            <StatCard icon={Users} label="Users (7d)" value={fmtNum(data.totals?.totalUsers)} accent="text-pink-400" />
            <StatCard icon={Eye} label="Page views (7d)" value={fmtNum(data.totals?.screenPageViews)} accent="text-fuchsia-400" />
            <StatCard icon={Gauge} label="Sessions (7d)" value={fmtNum(data.totals?.sessions)} accent="text-pink-400" />
            <StatCard icon={Clock} label="Avg session" value={fmtSec(data.totals?.averageSessionDuration)} accent="text-fuchsia-400" />
            <StatCard icon={TrendingUp} label="Engagement rate" value={data.totals?.engagementRate ? `${(data.totals.engagementRate * 100).toFixed(1)}%` : "—"} accent="text-pink-400" />
            <StatCard icon={Users} label="Total users (7d)" value={fmtNum(data.totals?.totalUsers)} accent="text-fuchsia-400" />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="font-semibold text-white mb-4">7-day traffic trend</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend || []}>
                  <defs>
                    <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF0080" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#FF0080" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D600FF" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#D600FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
                  <Legend />
                  <Area type="monotone" dataKey="sessions" stroke="#FF0080" fill="url(#gSessions)" strokeWidth={2} />
                  <Area type="monotone" dataKey="totalUsers" stroke="#D600FF" fill="url(#gUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}