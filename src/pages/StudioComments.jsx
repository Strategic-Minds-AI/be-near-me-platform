import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StudioSidebar from "@/components/studio/StudioSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Heart, 
  Trash2, 
  Flag,
  ThumbsUp,
  Reply,
  PlaySquare,
  CheckCircle
} from "lucide-react";

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "now";
}

export default function StudioComments() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos } = useQuery({
    queryKey: ['myVideos', user?.email],
    queryFn: () => base44.entities.Video.filter(
      { created_by: user?.email },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const videoIds = videos?.map(v => v.id) || [];

  const { data: comments, isLoading } = useQuery({
    queryKey: ['myVideoComments', videoIds],
    queryFn: async () => {
      if (!videoIds.length) return [];
      const allComments = await Promise.all(
        videoIds.map(id => base44.entities.Comment.filter({ video_id: id }, "-created_date", 50))
      );
      return allComments.flat().sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: videoIds.length > 0,
  });

  const heartMutation = useMutation({
    mutationFn: async (commentId) => {
      const comment = comments.find(c => c.id === commentId);
      await base44.entities.Comment.update(commentId, {
        is_hearted: !comment?.is_hearted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVideoComments']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.Comment.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myVideoComments']);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Comment.create({
        video_id: replyTo.video_id,
        parent_id: replyTo.id,
        text: replyText,
        author_name: user?.full_name || "Channel Owner",
        author_avatar: "",
      });
    },
    onSuccess: () => {
      setReplyTo(null);
      setReplyText("");
      queryClient.invalidateQueries(['myVideoComments']);
    },
  });

  // Filter comments
  const filteredComments = comments?.filter(comment => {
    const matchesSearch = !searchQuery || 
      comment.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "hearted") return matchesSearch && comment.is_hearted;
    if (filter === "unanswered") return matchesSearch && !comment.parent_id;
    return matchesSearch;
  }) || [];

  // Get video title for a comment
  const getVideoForComment = (videoId) => {
    return videos?.find(v => v.id === videoId);
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioComments" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Comments</h1>
              <p className="text-gray-400">{comments?.length || 0} total comments</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="bg-white/5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="hearted">Hearted</TabsTrigger>
                <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Comments List */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mx-auto"></div>
                </div>
              ) : filteredComments.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {filteredComments.map((comment) => {
                    const video = getVideoForComment(comment.video_id);
                    
                    return (
                      <div key={comment.id} className="p-4">
                        <div className="flex gap-4">
                          {/* Video Thumbnail */}
                          <Link 
                            to={createPageUrl(`Watch?v=${comment.video_id}`)}
                            className="w-24 aspect-video rounded-lg overflow-hidden bg-white/5 flex-shrink-0 hidden md:block"
                          >
                            {video?.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlaySquare className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                          </Link>

                          {/* Comment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={comment.author_avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                  {comment.author_name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-white">{comment.author_name}</span>
                                  <span className="text-gray-500 text-sm">{timeAgo(comment.created_date)}</span>
                                  {comment.is_hearted && (
                                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                                  )}
                                </div>
                                
                                <p className="text-gray-300 mt-1">{comment.text}</p>
                                
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    {comment.likes || 0}
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => heartMutation.mutate(comment.id)}
                                    className={`h-8 ${comment.is_hearted ? "text-red-400" : "text-gray-400"}`}
                                  >
                                    <Heart className={`w-4 h-4 mr-1 ${comment.is_hearted ? "fill-current" : ""}`} />
                                    {comment.is_hearted ? "Hearted" : "Heart"}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyTo(comment)}
                                    className="h-8 text-gray-400"
                                  >
                                    <Reply className="w-4 h-4 mr-1" />
                                    Reply
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 text-gray-400">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                                      <DropdownMenuItem 
                                        onClick={() => deleteMutation.mutate(comment.id)}
                                        className="text-red-400"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Flag className="w-4 h-4 mr-2" />
                                        Report
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Reply Input */}
                                {replyTo?.id === comment.id && (
                                  <div className="mt-3 flex gap-2">
                                    <Textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Write a reply..."
                                      className="bg-white/5 border-white/10 text-white min-h-[60px]"
                                    />
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => replyMutation.mutate()}
                                        disabled={!replyText.trim()}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        Reply
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setReplyTo(null);
                                          setReplyText("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No comments yet</h3>
                  <p className="text-gray-400">
                    Comments on your videos will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}