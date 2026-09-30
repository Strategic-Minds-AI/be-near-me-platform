import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsChart({ 
  title, 
  data, 
  type = "line", 
  dataKeys = [], 
  colors = ["#ef4444", "#3b82f6", "#10b981"],
  height = 300 
}) {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((key, i) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i]}
                fillOpacity={1}
                fill={`url(#gradient-${key})`}
              />
            ))}
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" tick={{ fill: "#666", fontSize: 12 }} />
            <YAxis stroke="#666" tick={{ fill: "#666", fontSize: 12 }} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: colors[i] }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}