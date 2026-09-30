import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Play, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Globe, 
  Lock,
  ListVideo,
  Shuffle
} from "lucide-react";

export default function Playlists() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({
    title: "",
    description: "",
    visibility: "private",
  });

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
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Playlist.create({
        title: newPlaylist.title,
        description: newPlaylist.description,
        visibility: newPlaylist.visibility,
        video_ids: [],
        videos_count: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlaylists']);
      setShowCreateDialog(false);
      setNewPlaylist({ title: "", description: "", visibility: "private" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Playlist.update(editingPlaylist.id, {
        title: editingPlaylist.title,
        description: editingPlaylist.description,
        visibility: editingPlaylist.visibility,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlaylists']);
      setEditingPlaylist(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (playlistId) => {
      await base44.entities.Playlist.delete(playlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myPlaylists']);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <ListVideo className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to see playlists</h2>
        <p className="text-gray-400 mb-6">Create and manage your video playlists</p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-blue-600 hover:bg-blue-700 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Playlists</h1>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-black hover:bg-gray-200 rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-white/10" />
                <div className="mt-3 h-4 bg-white/10 rounded w-3/4" />
                <div className="mt-2 h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="group">
                <Link 
                  to={createPageUrl(`Playlist?id=${playlist.id}`)}
                  className="relative block aspect-video rounded-xl overflow-hidden bg-white/5"
                >
                  {playlist.thumbnail_url ? (
                    <img
                      src={playlist.thumbnail_url}
                      alt={playlist.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <ListVideo className="w-12 h-12 text-gray-600" />
                    </div>
                  )}

                  {/* Video count overlay */}
                  <div className="absolute bottom-0 right-0 top-0 w-1/3 bg-black/80 flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-lg">{playlist.videos_count || 0}</span>
                    <ListVideo className="w-5 h-5 text-white mt-1" />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2 text-white">
                      <Play className="w-6 h-6 fill-white" />
                      <span className="font-medium">Play all</span>
                    </div>
                  </div>
                </Link>

                <div className="mt-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <Link 
                      to={createPageUrl(`Playlist?id=${playlist.id}`)}
                      className="font-medium text-white hover:text-gray-300 line-clamp-2"
                    >
                      {playlist.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                      {playlist.visibility === "private" ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      <span>{playlist.visibility}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                      <DropdownMenuItem 
                        onClick={() => setEditingPlaylist(playlist)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(playlist.id)}
                        className="flex items-center gap-2 cursor-pointer text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <ListVideo className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
            <p className="text-gray-400 mb-6">Create your first playlist to organize your favorite videos</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-black hover:bg-gray-200 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-[#212121] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={newPlaylist.title}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
                  placeholder="Enter playlist title"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  placeholder="Add a description"
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="public" className="text-white">Public</Label>
                <Switch
                  id="public"
                  checked={newPlaylist.visibility === "public"}
                  onCheckedChange={(checked) => 
                    setNewPlaylist({ ...newPlaylist, visibility: checked ? "public" : "private" })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate()}
                disabled={!newPlaylist.title.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingPlaylist} onOpenChange={() => setEditingPlaylist(null)}>
          <DialogContent className="bg-[#212121] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-title" className="text-white">Title</Label>
                <Input
                  id="edit-title"
                  value={editingPlaylist?.title || ""}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-white">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingPlaylist?.description || ""}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-public" className="text-white">Public</Label>
                <Switch
                  id="edit-public"
                  checked={editingPlaylist?.visibility === "public"}
                  onCheckedChange={(checked) => 
                    setEditingPlaylist({ ...editingPlaylist, visibility: checked ? "public" : "private" })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingPlaylist(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateMutation.mutate()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}