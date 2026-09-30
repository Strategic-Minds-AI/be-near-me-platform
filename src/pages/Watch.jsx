import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  MoreHorizontal,
  Bell,
  BellOff,
  Flag,
  ListPlus,
  ChevronDown,
  ChevronUp,
  Heart,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VideoGrid from "@/components/video/VideoGrid";
import VideoPlayer from "@/components/video/VideoPlayer";
import ReportDialog from "@/components/video/ReportDialog";
import SaveToPlaylistDialog from "@/components/video/SaveToPlaylistDialog";
import ShareDialog from "@/components/video/ShareDialog";

function formatViews(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

export default function Watch() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v");
  const queryClient = useQueryClient();

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => base44.entities.Video.filter({ id: videoId }),
    enabled: !!videoId,
  });

  const { data: channel } = useQuery({
    queryKey: ['channel', video?.[0]?.created_by],
    queryFn: () => base44.entities.Channel.filter({ created_by: video?.[0]?.created_by }),
    enabled: !!video?.[0]?.created_by,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => base44.entities.Comment.filter({ video_id: videoId }, "-created_date", 50),
    enabled: !!videoId,
  });

  const { data: suggestedVideos } = useQuery({
    queryKey: ['suggested', video?.[0]?.category],
    queryFn: () => base44.entities.Video.filter(
      { visibility: "public", category: video?.[0]?.category },
      "-views",
      20
    ),
    enabled: !!video?.[0]?.category,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', channel?.[0]?.id, user?.email],
    queryFn: () => base44.entities.Subscription.filter({ 
      channel_id: channel?.[0]?.id, 
      created_by: user?.email 
    }),
    enabled: !!channel?.[0]?.id && !!user?.email,
  });

  const { data: existingReaction } = useQuery({
    queryKey: ['reaction', videoId, user?.email],
    queryFn: () => base44.entities.Reaction.filter({ 
      target_id: videoId, 
      target_type: "video",
      created_by: user?.email 
    }),
    enabled: !!videoId && !!user?.email,
  });

  useEffect(() => {
    if (subscription?.[0]) setIsSubscribed(true);
  }, [subscription]);

  useEffect(() => {
    if (existingReaction?.[0]) setUserReaction(existingReaction[0].reaction);
  }, [existingReaction]);

  // Increment view count
  useEffect(() => {
    if (video?.[0] && videoId) {
      base44.entities.Video.update(videoId, { views: (video[0].views || 0) + 1 });
      // Add to watch history if logged in
      if (user?.email) {
        base44.entities.WatchHistory.create({
          video_id: videoId,
          video_title: video[0].title,
          video_thumbnail: video[0].thumbnail_url,
          channel_name: video[0].channel_name,
          watch_time: 0,
          duration: video[0].duration || 0,
          progress: 0,
        });
      }
    }
  }, [videoId, video?.[0]?.id]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (isSubscribed && subscription?.[0]) {
        await base44.entities.Subscription.delete(subscription[0].id);
        await base44.entities.Channel.update(channel[0].id, {
          subscribers_count: Math.max(0, (channel[0].subscribers_count || 1) - 1)
        });
      } else {
        await base44.entities.Subscription.create({
          channel_id: channel[0].id,
          channel_name: channel[0].name,
          channel_avatar: channel[0].avatar_url,
        });
        await base44.entities.Channel.update(channel[0].id, {
          subscribers_count: (channel[0].subscribers_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      setIsSubscribed(!isSubscribed);
      queryClient.invalidateQueries(['subscription']);
      queryClient.invalidateQueries(['channel']);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction) => {
      if (existingReaction?.[0]) {
        if (existingReaction[0].reaction === reaction) {
          await base44.entities.Reaction.delete(existingReaction[0].id);
          const field = reaction === "like" ? "likes" : "dislikes";
          await base44.entities.Video.update(videoId, {
            [field]: Math.max(0, (video[0][field] || 1) - 1)
          });
          return null;
        } else {
          await base44.entities.Reaction.update(existingReaction[0].id, { reaction });
          const oldField = existingReaction[0].reaction === "like" ? "likes" : "dislikes";
          const newField = reaction === "like" ? "likes" : "dislikes";
          await base44.entities.Video.update(videoId, {
            [oldField]: Math.max(0, (video[0][oldField] || 1) - 1),
            [newField]: (video[0][newField] || 0) + 1
          });
          return reaction;
        }
      } else {
        await base44.entities.Reaction.create({
          target_type: "video",
          target_id: videoId,
          reaction,
        });
        const field = reaction === "like" ? "likes" : "dislikes";
        await base44.entities.Video.update(videoId, {
          [field]: (video[0][field] || 0) + 1
        });
        return reaction;
      }
    },
    onSuccess: (result) => {
      setUserReaction(result);
      queryClient.invalidateQueries(['video', videoId]);
      queryClient.invalidateQueries(['reaction', videoId]);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Comment.create({
        video_id: videoId,
        text: commentText,
        author_name: user?.full_name || "Anonymous",
        author_avatar: channel?.[0]?.avatar_url || "",
      });
      await base44.entities.Video.update(videoId, {
        comments_count: (video[0].comments_count || 0) + 1
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries(['comments', videoId]);
      queryClient.invalidateQueries(['video', videoId]);
    },
  });

  const currentVideo = video?.[0];
  const currentChannel = channel?.[0];
  const filteredSuggested = suggestedVideos?.filter(v => v.id !== videoId) || [];

  if (videoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="text-6xl mb-4">🎬</span>
        <h2 className="text-2xl font-bold text-white mb-2">Video not found</h2>
        <p className="text-gray-400">The video you're looking for doesn't exist or was removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Video Player */}
          <VideoPlayer 
            video={currentVideo}
            onTimeUpdate={({ watchTime }) => {
              // Update watch session
              if (user?.email && watchTime > 0) {
                // Heartbeat tracking handled in VideoPlayer
              }
            }}
            onEnded={() => {
              // Mark as completed in watch history
            }}
          />

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {currentVideo.title}
            </h1>

            {/* Channel & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl(`Channel?id=${currentChannel?.id}`)}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={currentChannel?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {currentChannel?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link 
                    to={createPageUrl(`Channel?id=${currentChannel?.id}`)}
                    className="font-semibold text-white hover:text-gray-300"
                  >
                    {currentChannel?.name || currentVideo.channel_name}
                  </Link>
                  <p className="text-sm text-gray-400">
                    {formatViews(currentChannel?.subscribers_count || 0)} subscribers
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

              <div className="flex items-center gap-2 flex-wrap">
                {/* Like/Dislike */}
                <div className="flex items-center bg-white/10 rounded-full">
                  <Button
                    variant="ghost"
                    onClick={() => user && reactionMutation.mutate("like")}
                    className={`rounded-l-full px-4 hover:bg-white/10 ${
                      userReaction === "like" ? "text-blue-400" : "text-white"
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 mr-2 ${userReaction === "like" ? "fill-current" : ""}`} />
                    {formatViews(currentVideo.likes || 0)}
                  </Button>
                  <Separator orientation="vertical" className="h-6 bg-white/20" />
                  <Button
                    variant="ghost"
                    onClick={() => user && reactionMutation.mutate("dislike")}
                    className={`rounded-r-full px-4 hover:bg-white/10 ${
                      userReaction === "dislike" ? "text-blue-400" : "text-white"
                    }`}
                  >
                    <ThumbsDown className={`w-5 h-5 ${userReaction === "dislike" ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <Download className="w-4 h-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setShowPlaylistDialog(true)}
                    >
                      <ListPlus className="w-4 h-4" />
                      Save to Playlist
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer text-red-400"
                      onClick={() => setShowReportDialog(true)}
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <span>{formatViews(currentVideo.views || 0)} views</span>
                <span>•</span>
                <span>{formatDate(currentVideo.created_date)}</span>
                {currentVideo.tags?.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-400">
                      #{currentVideo.tags.slice(0, 3).join(" #")}
                    </span>
                  </>
                )}
              </div>
              
              <div className={`text-gray-200 whitespace-pre-wrap ${!showFullDescription && "line-clamp-3"}`}>
                {currentVideo.description || "No description provided."}
              </div>
              
              {currentVideo.description?.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 text-gray-400 hover:text-white p-0"
                >
                  {showFullDescription ? (
                    <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>

            {/* Comments */}
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {currentVideo.comments_count || 0} Comments
              </h3>

              {/* Comment Input */}
              {user ? (
                <div className="flex gap-4 mb-6">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={currentChannel?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {user.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-transparent border-0 border-b border-white/20 rounded-none focus:border-white resize-none min-h-[40px]"
                    />
                    {commentText && (
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setCommentText("")}
                          className="text-gray-400"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => commentMutation.mutate()}
                          className="bg-blue-600 hover:bg-blue-700 rounded-full"
                        >
                          Comment
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 mb-6">
                  Sign in to leave a comment
                </p>
              )}

              {/* Comment List */}
              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.author_avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {comment.author_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {comment.author_name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {timeAgo(comment.created_date)}
                        </span>
                        {comment.is_hearted && (
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        )}
                      </div>
                      <p className="text-gray-200 mt-1">{comment.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-white">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {comment.likes || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-white">
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-gray-400 hover:text-white">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Suggested Videos */}
        <div className="lg:w-[400px] xl:w-[420px] flex-shrink-0">
          <h3 className="text-lg font-semibold text-white mb-4">Up next</h3>
          <VideoGrid videos={filteredSuggested} variant="horizontal" />
        </div>
      </div>

      {/* Dialogs */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetType="video"
        targetId={videoId}
        targetTitle={currentVideo?.title}
      />

      <SaveToPlaylistDialog
        open={showPlaylistDialog}
        onOpenChange={setShowPlaylistDialog}
        video={currentVideo}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        video={currentVideo}
      />
    </div>
  );
}