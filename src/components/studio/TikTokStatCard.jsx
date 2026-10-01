import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function TikTokStatCard({ icon: Icon, label, value, trend, accent }) {
  const up = (trend || 0) >= 0;
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
          }`}
        >
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend || 0)}%
        </span>
      </div>
      <p className="text-3xl font-bold text-white mt-4 tracking-tight">{value}</p>
      <p className="text-sm text-white/50 mt-1">{label}</p>
    </div>
  );
}