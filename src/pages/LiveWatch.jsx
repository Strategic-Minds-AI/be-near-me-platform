import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  Share2, 
  Bell, 
  BellOff,
  Users,
  Eye,
  Radio
} from "lucide-react";
import LivePlayer from "@/components/live/LivePlayer";
import LiveChat from "@/components/live/LiveChat";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

export default function LiveWatch() {
  const urlParams = new URLSearchParams(window.location.search);
  const streamId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stream, isLoading: streamLoading } = useQuery({
    queryKey: ['liveStream', streamId],
    queryFn: () => base44.entities.LiveStream.filter({ id: streamId }),
    enabled: !!streamId,
    refetchInterval: 10000, // Refresh stream data every 10 seconds
  });

  const { data: channel } = useQuery({
    queryKey: ['streamChannel', stream?.[0]?.channel_id],
    queryFn: () => base44.entities.Channel.filter({ id: stream?.[0]?.channel_id }),
    enabled: !!stream?.[0]?.channel_id,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', channel?.[0]?.id, user?.email],
    queryFn: () => base44.entities.Subscription.filter({ 
      channel_id: channel?.[0]?.id, 
      created_by: user?.email 
    }),
    enabled: !!channel?.[0]?.id && !!user?.email,
  });

  useEffect(() => {
    if (subscription?.[0]) setIsSubscribed(true);
  }, [subscription]);

  // Increment viewer count on mount
  useEffect(() => {
    if (stream?.[0] && streamId) {
      base44.entities.LiveStream.update(streamId, {
        viewers_current: (stream[0].viewers_current || 0) + 1,
        total_views: (stream[0].total_views || 0) + 1,
      });

      // Decrement on unmount
      return () => {
        base44.entities.LiveStream.update(streamId, {
          viewers_current: Math.max(0, (stream[0].viewers_current || 1) - 1),
        });
      };
    }
  }, [streamId, stream?.[0]?.id]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (isSubscribed && subscription?.[0]) {
        await base44.entities.Subscription.delete(subscription[0].id);
      } else {
        await base44.entities.Subscription.create({
          channel_id: currentChannel.id,
          channel_name: currentChannel.name,
          channel_avatar: currentChannel.avatar_url,
        });
      }
    },
    onSuccess: () => {
      setIsSubscribed(!isSubscribed);
      queryClient.invalidateQueries(['subscription']);
    },
  });

  const currentStream = stream?.[0];
  const currentChannel = channel?.[0];

  if (streamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Radio className="w-12 h-12 text-red-500 animate-pulse mx-auto mb-4" />
          <p className="text-white">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!currentStream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Radio className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Stream not found</h2>
        <p className="text-gray-400">This stream may have ended or doesn't exist.</p>
        <Link to={createPageUrl("Live")}>
          <Button className="mt-6 bg-red-600 hover:bg-red-700 rounded-full">
            Browse Live Streams
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Player */}
            <LivePlayer stream={currentStream} />

            {/* Stream Info */}
            <div className="mt-4">
              <div className="flex items-start gap-2 mb-2">
                <Badge className="bg-red-600 text-white">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
                <Badge variant="outline" className="text-gray-400">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatCount(currentStream.viewers_current || 0)} watching
                </Badge>
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-white">
                {currentStream.title}
              </h1>

              {/* Channel & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <Link to={createPageUrl(`Channel?id=${currentChannel?.id}`)}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={currentChannel?.avatar_url || currentStream.channel_avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {currentChannel?.name?.[0] || currentStream.channel_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link 
                      to={createPageUrl(`Channel?id=${currentChannel?.id}`)}
                      className="font-semibold text-white hover:text-gray-300"
                    >
                      {currentChannel?.name || currentStream.channel_name}
                    </Link>
                    <p className="text-sm text-gray-400">
                      {formatCount(currentChannel?.subscribers_count || 0)} subscribers
                    </p>
                  </div>
                  
                  {user && currentChannel?.created_by !== user?.email && (
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
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    {formatCount(currentStream.likes || 0)}
                  </Button>

                  <Button variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Description */}
              {currentStream.description && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {currentStream.description}
                  </p>
                  {currentStream.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentStream.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-blue-400">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:w-[350px] xl:w-[400px] h-[500px] lg:h-[calc(100vh-120px)] flex-shrink-0">
            <LiveChat 
              streamId={streamId} 
              channelOwnerEmail={currentChannel?.created_by}
            />
          </div>
        </div>
      </div>
    </div>
  );
}