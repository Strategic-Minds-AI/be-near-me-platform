import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import TikTokVideoCard from "./TikTokVideoCard";
import { Loader2 } from "lucide-react";

export default function TikTokFeed() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['tiktokFeed', user?.email],
    queryFn: async () => {
      if (user?.email) {
        const res = await base44.functions.invoke('recommendVideos', { limit: 30 });
        return res.data?.videos || [];
      }
      return base44.entities.Video.filter({ visibility: "public" }, "-views", 30);
    },
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const list = (videos || []).filter((v) => v.url);

  if (list.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black text-white/70 text-center px-6">
        <div>
          <p className="text-lg font-semibold mb-1">No videos yet</p>
          <p className="text-sm">Upload a video to start the feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory bg-black [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {list.map((v) => (
        <TikTokVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}