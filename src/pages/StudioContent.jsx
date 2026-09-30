import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StudioSidebar from "@/components/studio/StudioSidebar";
import VideoTable from "@/components/studio/VideoTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Search, 
  Filter,
  Trash2,
  Grid,
  List
} from "lucide-react";

export default function StudioContent() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [filter, setFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['myVideos', user?.email],
    queryFn: () => base44.entities.Video.filter(
      { created_by: user?.email },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId) => {
      await base44.entities.Video.delete(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVideos']);
      setVideoToDelete(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map(id => base44.entities.Video.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVideos']);
      setSelectedIds([]);
    },
  });

  // Filter videos
  const filteredVideos = videos?.filter(video => {
    const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "public") return matchesSearch && video.visibility === "public";
    if (filter === "private") return matchesSearch && video.visibility === "private";
    if (filter === "unlisted") return matchesSearch && video.visibility === "unlisted";
    return matchesSearch;
  }) || [];

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioContent" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Channel Content</h1>
              <p className="text-gray-400">{videos?.length || 0} videos</p>
            </div>
            
            <Link to={createPageUrl("Upload")}>
              <Button className="bg-red-600 hover:bg-red-700 rounded-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="bg-white/5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                  <TabsTrigger value="unlisted">Unlisted</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-white/10" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-white/10" : ""}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl mb-6">
              <span className="text-white">{selectedIds.length} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => bulkDeleteMutation.mutate()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Content */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                </div>
              ) : filteredVideos.length > 0 ? (
                <VideoTable
                  videos={filteredVideos}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  onDelete={setVideoToDelete}
                />
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchQuery ? "No videos found" : "No videos yet"}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {searchQuery ? "Try a different search term" : "Upload your first video to get started"}
                  </p>
                  {!searchQuery && (
                    <Link to={createPageUrl("Upload")}>
                      <Button className="bg-red-600 hover:bg-red-700 rounded-full">
                        Upload Video
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!videoToDelete} onOpenChange={() => setVideoToDelete(null)}>
        <DialogContent className="bg-[#212121] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVideoToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate(videoToDelete?.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}