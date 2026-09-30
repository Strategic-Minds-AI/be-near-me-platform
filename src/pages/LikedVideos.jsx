import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Play, Shuffle } from "lucide-react";
import VideoGrid from "@/components/video/VideoGrid";

export default function LikedVideos() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reactions, isLoading: reactionsLoading } = useQuery({
    queryKey: ['likedReactions', user?.email],
    queryFn: () => base44.entities.Reaction.filter(
      { created_by: user?.email, target_type: "video", reaction: "like" },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['likedVideos', reactions],
    queryFn: async () => {
      if (!reactions?.length) return [];
      const videoIds = reactions.map(r => r.target_id);
      const allVideos = await Promise.all(
        videoIds.map(id => base44.entities.Video.filter({ id }))
      );
      return allVideos.flat();
    },
    enabled: !!reactions?.length,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <ThumbsUp className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to see your liked videos</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Videos you like will be saved here
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

  const isLoading = reactionsLoading || videosLoading;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Playlist Cover */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <ThumbsUp className="w-20 h-20 text-white" />
            </div>
            
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-white">Liked Videos</h1>
              <p className="text-gray-400 mt-1">
                {videos?.length || 0} videos
              </p>
              
              {videos?.length > 0 && (
                <div className="flex gap-3 mt-4">
                  <Button className="flex-1 bg-white text-black hover:bg-gray-200 rounded-full">
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Play all
                  </Button>
                  <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20 rounded-full">
                    <Shuffle className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Videos List */}
          <div className="flex-1">
            {videos?.length > 0 ? (
              <VideoGrid videos={videos} isLoading={isLoading} variant="horizontal" />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  <ThumbsUp className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No liked videos yet</h3>
                <p className="text-gray-400">
                  Videos you like will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}