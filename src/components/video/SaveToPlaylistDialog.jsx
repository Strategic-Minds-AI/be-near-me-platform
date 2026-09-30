import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, ListVideo } from "lucide-react";

export default function SaveToPlaylistDialog({ open, onOpenChange, video }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['myPlaylists', user?.email],
    queryFn: () => base44.entities.Playlist.filter(
      { created_by: user?.email },
      "-created_date",
      50
    ),
    enabled: !!user?.email && open,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      const playlist = await base44.entities.Playlist.create({
        title: newPlaylistName,
        video_ids: [video.id],
        videos_count: 1,
        visibility: "private",
        thumbnail_url: video.thumbnail_url,
      });
      return playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlaylists']);
      setNewPlaylistName("");
      setShowCreate(false);
    },
  });

  const toggleVideoInPlaylist = useMutation({
    mutationFn: async ({ playlist, add }) => {
      const currentIds = playlist.video_ids || [];
      let newIds;
      
      if (add) {
        if (currentIds.includes(video.id)) return;
        newIds = [...currentIds, video.id];
      } else {
        newIds = currentIds.filter(id => id !== video.id);
      }
      
      await base44.entities.Playlist.update(playlist.id, {
        video_ids: newIds,
        videos_count: newIds.length,
        thumbnail_url: newIds.length > 0 ? video.thumbnail_url : "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlaylists']);
    },
  });

  const isVideoInPlaylist = (playlist) => {
    return playlist.video_ids?.includes(video?.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#212121] border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Save to playlist</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {playlists?.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer"
                  onClick={() => toggleVideoInPlaylist.mutate({
                    playlist,
                    add: !isVideoInPlaylist(playlist)
                  })}
                >
                  <Checkbox
                    checked={isVideoInPlaylist(playlist)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                      {playlist.thumbnail_url ? (
                        <img
                          src={playlist.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <ListVideo className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {playlist.title}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {playlist.videos_count || 0} videos
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {playlists?.length === 0 && !showCreate && (
                <div className="text-center py-8">
                  <ListVideo className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No playlists yet</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Create New Playlist */}
        <div className="pt-4 border-t border-white/10">
          {showCreate ? (
            <div className="space-y-3">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="bg-white/5 border-white/10 text-white"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreate(false);
                    setNewPlaylistName("");
                  }}
                  className="text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => createPlaylistMutation.mutate()}
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createPlaylistMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-5 h-5 mr-3" />
              Create new playlist
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}