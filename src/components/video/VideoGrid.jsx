import React from "react";
import VideoCard from "./VideoCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoGrid({ videos, isLoading, variant = "default" }) {
  if (isLoading) {
    return (
      <div className={`grid gap-4 ${
        variant === "horizontal" 
          ? "grid-cols-1" 
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      }`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={variant === "horizontal" ? "flex gap-3" : ""}>
            <Skeleton className={`${variant === "horizontal" ? "w-40 md:w-44" : "w-full"} aspect-video rounded-xl`} />
            <div className={`flex gap-3 ${variant === "horizontal" ? "flex-1" : "mt-3"}`}>
              {variant !== "horizontal" && <Skeleton className="w-9 h-9 rounded-full" />}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-5xl">🎬</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
        <p className="text-gray-400">Videos will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${
      variant === "horizontal" 
        ? "grid-cols-1" 
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    }`}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} variant={variant} />
      ))}
    </div>
  );
}