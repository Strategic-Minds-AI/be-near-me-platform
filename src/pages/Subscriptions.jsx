import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VideoGrid from "@/components/video/VideoGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlaySquare, UserPlus } from "lucide-react";

export default function Subscriptions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions', user?.email],
    queryFn: () => base44.entities.Subscription.filter(
      { created_by: user?.email },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['subscriptionVideos', subscriptions],
    queryFn: async () => {
      if (!subscriptions?.length) return [];
      
      // Get all channel IDs
      const channelIds = subscriptions.map(s => s.channel_id);
      
      // Get channels to find their creators
      const channels = await Promise.all(
        channelIds.map(id => base44.entities.Channel.filter({ id }))
      );
      
      // Get creator emails
      const creatorEmails = channels.flat().map(c => c.created_by);
      
      // Get videos from subscribed channels
      const allVideos = await base44.entities.Video.filter(
        { visibility: "public" },
        "-created_date",
        100
      );
      
      return allVideos.filter(v => creatorEmails.includes(v.created_by));
    },
    enabled: !!subscriptions?.length,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <PlaySquare className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to see your subscriptions</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Subscribe to channels to get personalized recommendations and never miss a video
        </p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-blue-600 hover:bg-blue-700 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const isLoading = subsLoading || videosLoading;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>

      {/* Subscribed Channels */}
      {subscriptions?.length > 0 && (
        <div className="mb-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {subscriptions.map((sub) => (
                <Link
                  key={sub.id}
                  to={createPageUrl(`Channel?id=${sub.channel_id}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <Avatar className="w-16 h-16 ring-2 ring-transparent group-hover:ring-red-500 transition-all">
                    <AvatarImage src={sub.channel_avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                      {sub.channel_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-400 text-center max-w-[80px] truncate">
                    {sub.channel_name}
                  </span>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Videos */}
      {subscriptions?.length > 0 ? (
        <VideoGrid videos={videos} isLoading={isLoading} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <UserPlus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No subscriptions yet</h3>
          <p className="text-gray-400 max-w-md">
            Subscribe to channels you like to see their latest videos here
          </p>
          <Link to={createPageUrl("Explore")}>
            <Button className="mt-6 bg-blue-600 hover:bg-blue-700 rounded-full px-8">
              Explore Channels
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}