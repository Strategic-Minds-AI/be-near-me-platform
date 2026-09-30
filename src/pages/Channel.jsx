import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Share2, MoreVertical, Flag, CheckCircle, ExternalLink, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VideoGrid from "@/components/video/VideoGrid";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function Channel() {
  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (channelId) {
        return base44.entities.Channel.filter({ id: channelId });
      }
      return [];
    },
    enabled: !!channelId,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['channelVideos', channel?.[0]?.created_by],
    queryFn: () => base44.entities.Video.filter(
      { created_by: channel?.[0]?.created_by, visibility: "public" },
      "-created_date",
      50
    ),
    enabled: !!channel?.[0]?.created_by,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', channelId, user?.email],
    queryFn: () => base44.entities.Subscription.filter({ 
      channel_id: channelId, 
      created_by: user?.email 
    }),
    enabled: !!channelId && !!user?.email,
  });

  useEffect(() => {
    if (subscription?.[0]) setIsSubscribed(true);
  }, [subscription]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (isSubscribed && subscription?.[0]) {
        await base44.entities.Subscription.delete(subscription[0].id);
        await base44.entities.Channel.update(channelId, {
          subscribers_count: Math.max(0, (currentChannel.subscribers_count || 1) - 1)
        });
      } else {
        await base44.entities.Subscription.create({
          channel_id: channelId,
          channel_name: currentChannel.name,
          channel_avatar: currentChannel.avatar_url,
        });
        await base44.entities.Channel.update(channelId, {
          subscribers_count: (currentChannel.subscribers_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      setIsSubscribed(!isSubscribed);
      queryClient.invalidateQueries(['subscription']);
      queryClient.invalidateQueries(['channel']);
    },
  });

  const currentChannel = channel?.[0];
  const isOwner = user?.email === currentChannel?.created_by;

  if (channelLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="text-6xl mb-4">📺</span>
        <h2 className="text-2xl font-bold text-white mb-2">Channel not found</h2>
        <p className="text-gray-400">The channel you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-56">
        {currentChannel.banner_url ? (
          <img
            src={currentChannel.banner_url}
            alt="Channel banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" />
        )}
      </div>

      {/* Channel Info */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 md:-mt-16 relative z-10">
          <Avatar className="w-24 h-24 md:w-40 md:h-40 border-4 border-[#0f0f0f] shadow-2xl">
            <AvatarImage src={currentChannel.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl md:text-6xl">
              {currentChannel.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {currentChannel.name}
              </h1>
              {currentChannel.verified && (
                <CheckCircle className="w-6 h-6 text-gray-400 fill-current" />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-gray-400 mt-1">
              <span>@{currentChannel.handle}</span>
              <span>•</span>
              <span>{formatCount(currentChannel.subscribers_count || 0)} subscribers</span>
              <span>•</span>
              <span>{videos?.length || 0} videos</span>
            </div>

            <p className="text-gray-400 mt-2 line-clamp-1">
              {currentChannel.description || "No description"}
            </p>

            {/* Links */}
            {currentChannel.links?.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {currentChannel.links.slice(0, 3).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pb-4">
            {!isOwner && user && (
              <Button
                onClick={() => subscribeMutation.mutate()}
                className={`rounded-full px-6 ${
                  isSubscribed 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Subscribed
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            )}

            <Button variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20">
              <Share2 className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-400">
                  <Flag className="w-4 h-4" />
                  Report Channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="mt-6">
          <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none h-12 p-0">
            <TabsTrigger 
              value="videos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger 
              value="playlists"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              Playlists
            </TabsTrigger>
            <TabsTrigger 
              value="community"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              Community
            </TabsTrigger>
            <TabsTrigger 
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent"
            >
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-6">
            {/* Featured Video */}
            {videos?.[0] && (
              <div className="mb-8 p-4 bg-white/5 rounded-xl">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative md:w-80 aspect-video rounded-xl overflow-hidden">
                    {videos[0].thumbnail_url ? (
                      <img
                        src={videos[0].thumbnail_url}
                        alt={videos[0].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Featured Video</span>
                    <h3 className="text-xl font-bold text-white mt-1">{videos[0].title}</h3>
                    <p className="text-gray-400 mt-2 line-clamp-2">{videos[0].description}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {formatCount(videos[0].views || 0)} views
                    </p>
                  </div>
                </div>
              </div>
            )}

            <VideoGrid videos={videos} isLoading={videosLoading} />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <div className="text-center py-8">
              <Link to={createPageUrl(`Community?id=${channelId}`)}>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl transition-colors text-lg font-medium">
                  Open Community Tab →
                </button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-5xl">📁</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
              <p className="text-gray-400">Playlists created by this channel will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
              <p className="text-gray-300 whitespace-pre-wrap">
                {currentChannel.description || "No description provided."}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Stats</h4>
                  <p className="text-white">{formatCount(currentChannel.subscribers_count || 0)} subscribers</p>
                  <p className="text-white">{videos?.length || 0} videos</p>
                  <p className="text-white">{formatCount(currentChannel.total_views || 0)} total views</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Joined</h4>
                  <p className="text-white">
                    {currentChannel.created_date 
                      ? new Date(currentChannel.created_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {currentChannel.links?.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Links</h4>
                  <div className="space-y-2">
                    {currentChannel.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}