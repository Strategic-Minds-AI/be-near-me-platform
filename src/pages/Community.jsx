import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PostComposer from "@/components/community/PostComposer";
import PostCard from "@/components/community/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageSquare } from "lucide-react";

export default function Community() {
  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get("id");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => base44.entities.Channel.filter({ id: channelId }),
    enabled: !!channelId,
  });

  const { data: myChannel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['communityPosts', channelId],
    queryFn: () => base44.entities.CommunityPost.filter(
      { channel_id: channelId || currentChannel?.id },
      "-created_date",
      50
    ),
    enabled: !!(channelId || myChannel?.[0]?.id),
  });

  const currentChannel = channelId ? channel?.[0] : myChannel?.[0];
  const isOwner = user?.email === currentChannel?.created_by;

  if (!currentChannel && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <MessageSquare className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No channel found</h2>
        <p className="text-gray-400 mb-6">Create a channel to start posting to your community</p>
        <Link to={createPageUrl("CreateChannel")}>
          <Button className="bg-red-600 hover:bg-red-700 rounded-full px-8">Create Channel</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Channel header */}
        {currentChannel && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <Avatar className="w-14 h-14">
              <AvatarImage src={currentChannel.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xl">
                {currentChannel.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-white">{currentChannel.name}</h1>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{(currentChannel.subscribers_count || 0).toLocaleString()} subscribers</span>
              </div>
            </div>
          </div>
        )}

        {/* Composer (channel owner only) */}
        {isOwner && currentChannel && (
          <div className="mb-6">
            <PostComposer channel={currentChannel} user={user} />
          </div>
        )}

        {/* Posts feed */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : posts?.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} user={user} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400">
              {isOwner ? "Share something with your community!" : "This channel hasn't posted yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}