import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StatsOverview from "@/components/studio/StatsOverview";
import AnalyticsChart from "@/components/studio/AnalyticsChart";
import VideoTable from "@/components/studio/VideoTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Upload, 
  Bell,
  MessageSquare,
  ThumbsUp,
  PlaySquare
} from "lucide-react";
import ReputationCard from "@/components/studio/ReputationCard";

export default function CreatorStudio() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['myVideos', user?.email],
    queryFn: () => base44.entities.Video.filter(
      { created_by: user?.email },
      "-created_date",
      10
    ),
    enabled: !!user?.email,
  });

  const myChannel = channel?.[0];

  // Calculate stats
  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;
  const totalComments = videos?.reduce((sum, v) => sum + (v.comments_count || 0), 0) || 0;

  const stats = [
    { 
      label: "Total Views", 
      value: totalViews, 
      icon: Eye, 
      color: "from-blue-500 to-cyan-500",
      trend: 12
    },
    { 
      label: "Subscribers", 
      value: myChannel?.subscribers_count || 0, 
      icon: Users, 
      color: "from-purple-500 to-pink-500",
      trend: 5
    },
    { 
      label: "Watch Time (hrs)", 
      value: Math.round((myChannel?.total_watch_time || 0) / 3600), 
      icon: Clock, 
      color: "from-green-500 to-emerald-500",
      trend: 8
    },
    { 
      label: "Revenue", 
      value: (myChannel?.earnings_balance || 0) / 100, 
      icon: DollarSign, 
      color: "from-yellow-500 to-orange-500",
      type: "currency",
      trend: 15
    },
  ];

  // Generate sample chart data
  const chartData = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: Math.floor(Math.random() * 5000) + 1000,
      watchTime: Math.floor(Math.random() * 1000) + 200,
    };
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <PlaySquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to access Creator Studio</h2>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-red-600 hover:bg-red-700 rounded-full px-8 mt-4"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!myChannel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <div className="text-center">
          <PlaySquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Create a channel first</h2>
          <p className="text-gray-400 mb-4">You need a channel to access Creator Studio</p>
          <Link to={createPageUrl("CreateChannel")}>
            <Button className="bg-red-600 hover:bg-red-700 rounded-full px-8">
              Create Channel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="CreatorStudio" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={myChannel.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                  {myChannel.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {myChannel.name}
                </h1>
                <p className="text-gray-400">@{myChannel.handle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Link to={createPageUrl("Upload")}>
                <Button className="bg-red-600 hover:bg-red-700 rounded-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <AnalyticsChart
              title="Views (Last 28 days)"
              data={chartData}
              type="area"
              dataKeys={["views"]}
              colors={["#ef4444"]}
            />
            <AnalyticsChart
              title="Watch Time (hours)"
              data={chartData}
              type="line"
              dataKeys={["watchTime"]}
              colors={["#3b82f6"]}
            />
          </div>

          {/* Quick Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{totalComments}</p>
                    <p className="text-gray-400 text-sm">Total Comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <ThumbsUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{totalLikes}</p>
                    <p className="text-gray-400 text-sm">Total Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{videos?.length || 0}</p>
                    <p className="text-gray-400 text-sm">Total Videos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reputation */}
          <div className="mt-6">
            <ReputationCard channelId={myChannel?.id} />
          </div>

          {/* Recent Videos */}
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Recent Videos</CardTitle>
              <Link to={createPageUrl("StudioContent")}>
                <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {videos?.length > 0 ? (
                <VideoTable videos={videos.slice(0, 5)} showCheckboxes={false} />
              ) : (
                <div className="text-center py-12">
                  <PlaySquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No videos yet</h3>
                  <p className="text-gray-400 mb-4">Upload your first video to get started</p>
                  <Link to={createPageUrl("Upload")}>
                    <Button className="bg-red-600 hover:bg-red-700 rounded-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}