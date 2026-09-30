import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Search, Trash2, Pause, Play } from "lucide-react";

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

export default function History() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['watchHistory', user?.email],
    queryFn: () => base44.entities.WatchHistory.filter(
      { created_by: user?.email },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!history?.length) return;
      await Promise.all(history.map(h => base44.entities.WatchHistory.delete(h.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchHistory']);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WatchHistory.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchHistory']);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <Clock className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Keep track of what you watch</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Watch history isn't viewable when signed out
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

  const filteredHistory = history?.filter(h => 
    h.video_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.channel_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.created_date).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search history"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white w-64"
              />
            </div>
            
            {history?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => clearHistoryMutation.mutate()}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-40 aspect-video bg-white/10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-400 mb-4">{date}</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <Link 
                        to={createPageUrl(`Watch?v=${item.video_id}`)}
                        className="relative w-40 md:w-48 flex-shrink-0"
                      >
                        <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                          {item.video_thumbnail ? (
                            <img
                              src={item.video_thumbnail}
                              alt={item.video_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">🎬</span>
                            </div>
                          )}
                        </div>
                        {/* Progress bar */}
                        {item.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div 
                              className="h-full bg-red-500"
                              style={{ width: `${Math.min(item.progress, 100)}%` }}
                            />
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <Link to={createPageUrl(`Watch?v=${item.video_id}`)}>
                          <h4 className="font-medium text-white line-clamp-2 hover:text-gray-300">
                            {item.video_title}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-400 mt-1">
                          {item.channel_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeAgo(item.created_date)}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No results found" : "No watch history"}
            </h3>
            <p className="text-gray-400">
              {searchQuery 
                ? "Try different keywords" 
                : "Videos you watch will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}