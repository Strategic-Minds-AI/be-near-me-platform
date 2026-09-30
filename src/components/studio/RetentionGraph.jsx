import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function RetentionGraph({ duration = 600, retentionData }) {
  // Generate realistic retention curve if no real data
  const data = retentionData || (() => {
    const points = [];
    const segments = Math.min(20, Math.floor(duration / 30));
    for (let i = 0; i <= segments; i++) {
      const t = Math.round((i / segments) * duration);
      // Simulate realistic YouTube retention curve
      let retention = 100;
      if (t === 0) retention = 100;
      else if (t <= 30) retention = 100 - (t / 30) * 25; // big drop first 30s
      else {
        const base = 75 - ((t - 30) / (duration - 30)) * 55;
        const noise = (Math.random() - 0.5) * 4;
        retention = Math.max(5, base + noise);
      }
      const mins = Math.floor(t / 60);
      const secs = t % 60;
      points.push({
        time: t < 60 ? `${t}s` : `${mins}:${secs.toString().padStart(2, '0')}`,
        retention: Math.round(retention * 10) / 10,
        t,
      });
    }
    return points;
  })();

  const avgRetention = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.retention, 0) / data.length)
    : 0;

  // Find biggest drop-off point
  let maxDrop = 0, dropIdx = 1;
  for (let i = 1; i < data.length; i++) {
    const drop = data[i - 1].retention - data[i].retention;
    if (drop > maxDrop) { maxDrop = drop; dropIdx = i; }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-green-400 font-semibold">{payload[0]?.value}% retained</p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-400">Avg retention </span>
            <span className={`font-bold ${avgRetention >= 50 ? 'text-green-400' : avgRetention >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {avgRetention}%
            </span>
          </div>
          {maxDrop > 5 && (
            <div>
              <span className="text-gray-400">Biggest drop </span>
              <span className="text-orange-400 font-semibold">@ {data[dropIdx]?.time}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Good (50%+)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Avg (30-50%)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#374151" strokeDasharray="3 3" />
          <ReferenceLine y={avgRetention} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
          {maxDrop > 5 && (
            <ReferenceLine x={data[dropIdx]?.time} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.7} />
          )}
          <Area
            type="monotone"
            dataKey="retention"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#retentionGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}