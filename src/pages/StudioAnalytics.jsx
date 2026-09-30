import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StatsOverview from "@/components/studio/StatsOverview";
import AnalyticsChart from "@/components/studio/AnalyticsChart";
import RetentionGraph from "@/components/studio/RetentionGraph";
import ReputationCard from "@/components/studio/ReputationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  ExternalLink,
  Play
} from "lucide-react";

export default function StudioAnalytics() {
  const [timeRange, setTimeRange] = useState("28");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: videos } = useQuery({
    queryKey: ['myVideos', user?.email],
    queryFn: () => base44.entities.Video.filter(
      { created_by: user?.email },
      "-views",
      50
    ),
    enabled: !!user?.email,
  });

  const myChannel = channel?.[0];

  // Calculate stats
  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;

  const stats = [
    { 
      label: "Views", 
      value: totalViews, 
      icon: Eye, 
      color: "from-blue-500 to-cyan-500",
      trend: 12
    },
    { 
      label: "Watch Time (hrs)", 
      value: Math.round((myChannel?.total_watch_time || 0) / 3600), 
      icon: Clock, 
      color: "from-green-500 to-emerald-500",
      trend: 8
    },
    { 
      label: "Subscribers", 
      value: myChannel?.subscribers_count || 0, 
      icon: Users, 
      color: "from-purple-500 to-pink-500",
      trend: 5
    },
    { 
      label: "Engagement Rate", 
      value: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) + "%" : "0%", 
      icon: TrendingUp, 
      color: "from-yellow-500 to-orange-500",
      trend: 3
    },
  ];

  // Generate chart data
  const days = parseInt(timeRange);
  const viewsData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: Math.floor(Math.random() * 5000) + 1000,
      uniqueViewers: Math.floor(Math.random() * 3000) + 500,
    };
  });

  const watchTimeData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      watchTime: Math.floor(Math.random() * 500) + 100,
      avgViewDuration: Math.floor(Math.random() * 10) + 2,
    };
  });

  const subscribersData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      gained: Math.floor(Math.random() * 100) + 10,
      lost: Math.floor(Math.random() * 20) + 2,
    };
  });

  // Traffic sources
  const trafficSources = [
    { source: "Browse features", percentage: 35, icon: Globe },
    { source: "Search", percentage: 28, icon: Search },
    { source: "Suggested videos", percentage: 22, icon: Play },
    { source: "External", percentage: 10, icon: ExternalLink },
    { source: "Direct", percentage: 5, icon: Globe },
  ];

  // Device breakdown
  const devices = [
    { device: "Mobile", percentage: 65, icon: Smartphone },
    { device: "Desktop", percentage: 28, icon: Monitor },
    { device: "Tablet", percentage: 7, icon: Tablet },
  ];

  // Top videos with per-video metrics
  const topVideos = videos?.slice(0, 5) || [];

  // Per-video breakdown with simulated CTR / impressions
  const videoMetrics = videos?.slice(0, 10).map(v => ({
    ...v,
    impressions: Math.floor((v.views || 0) * (2.5 + Math.random())),
    ctr: (2 + Math.random() * 8).toFixed(1),
    avgViewDuration: Math.floor(((v.duration || 300) * (0.3 + Math.random() * 0.4))),
  })) || [];

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioAnalytics" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Channel Analytics</h1>
              <p className="text-gray-400">Track your channel's performance</p>
            </div>
            
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="bg-white/5">
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="28">28 days</TabsTrigger>
                <TabsTrigger value="90">90 days</TabsTrigger>
                <TabsTrigger value="365">365 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <AnalyticsChart
              title="Views"
              data={viewsData}
              type="area"
              dataKeys={["views", "uniqueViewers"]}
              colors={["#ef4444", "#3b82f6"]}
            />
            <AnalyticsChart
              title="Watch Time (hours)"
              data={watchTimeData}
              type="line"
              dataKeys={["watchTime"]}
              colors={["#10b981"]}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <AnalyticsChart
              title="Subscribers"
              data={subscribersData}
              type="bar"
              dataKeys={["gained", "lost"]}
              colors={["#10b981", "#ef4444"]}
            />

            {/* Traffic Sources */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trafficSources.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <source.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">{source.source}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{source.percentage}%</span>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Retention + Reputation Row */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Audience Retention</CardTitle>
                <p className="text-gray-400 text-sm">Average across all videos</p>
              </CardHeader>
              <CardContent>
                <RetentionGraph duration={myChannel?.total_watch_time ? Math.min(myChannel.total_watch_time / Math.max(videos?.length || 1, 1), 1800) : 600} />
              </CardContent>
            </Card>
            <ReputationCard channelId={myChannel?.id} />
          </div>

          {/* Per-Video Breakdown */}
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Video Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left py-3 pr-4 font-medium">Video</th>
                      <th className="text-right py-3 px-3 font-medium">Views</th>
                      <th className="text-right py-3 px-3 font-medium">Impressions</th>
                      <th className="text-right py-3 px-3 font-medium">CTR</th>
                      <th className="text-right py-3 px-3 font-medium">Avg Duration</th>
                      <th className="text-right py-3 pl-3 font-medium">Likes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {videoMetrics.map(v => (
                      <tr key={v.id} className="hover:bg-white/3">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 aspect-video rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                              {v.thumbnail_url
                                ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">🎬</div>}
                            </div>
                            <span className="text-white font-medium line-clamp-1 max-w-[200px]">{v.title}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-3 text-gray-300">{(v.views || 0).toLocaleString()}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{v.impressions.toLocaleString()}</td>
                        <td className="text-right py-3 px-3 text-blue-400 font-medium">{v.ctr}%</td>
                        <td className="text-right py-3 px-3 text-gray-300">
                          {Math.floor(v.avgViewDuration / 60)}:{String(v.avgViewDuration % 60).padStart(2,'0')}
                        </td>
                        <td className="text-right py-3 pl-3 text-green-400">{(v.likes || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {videoMetrics.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No videos yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Device Breakdown */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {devices.map((device) => (
                  <div key={device.device} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <device.icon className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-white">{device.device}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{device.percentage}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Videos */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Videos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topVideos.map((video, index) => (
                  <div key={video.id} className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-600 w-8">{index + 1}</span>
                    <div className="w-20 aspect-video rounded-lg bg-white/5 overflow-hidden">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          🎬
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
                      <p className="text-gray-500 text-xs">
                        {(video.views || 0).toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}