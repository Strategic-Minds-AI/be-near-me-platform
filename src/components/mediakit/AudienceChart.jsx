import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3 } from "lucide-react";

const COLORS = ["#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#6366F1", "#F472B6"];

export default function AudienceChart({ data }) {
  if (!data) return null;

  const ageData = data.age_distribution || [
    { range: "13-17", value: 8 },
    { range: "18-24", value: 35 },
    { range: "25-34", value: 32 },
    { range: "35-44", value: 15 },
    { range: "45+", value: 10 },
  ];

  const genderData = data.gender_distribution || [
    { name: "Female", value: 55 },
    { name: "Male", value: 40 },
    { name: "Other", value: 5 },
  ];

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-fuchsia-600 p-5">
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <BarChart3 size={24} />
          Audience Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Age Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {ageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Gender Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={{ stroke: "#9ca3af" }}
                  tick={{ fill: "#9ca3af" }}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}