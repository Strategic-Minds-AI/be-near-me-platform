import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Bell, 
  Video, 
  MessageCircle, 
  ThumbsUp, 
  UserPlus,
  Radio,
  Settings,
  CheckCheck,
  Trash2
} from "lucide-react";

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

const notificationIcons = {
  new_video: Video,
  live_now: Radio,
  comment_reply: MessageCircle,
  mention: MessageCircle,
  subscription: UserPlus,
  like: ThumbsUp,
  milestone: Bell,
  system: Bell,
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { created_by: user?.email },
      "-created_date",
      100
    ),
    enabled: !!user?.email,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications?.filter(n => !n.read) || [];
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!notifications?.length) return;
      await Promise.all(notifications.map(n => 
        base44.entities.Notification.delete(n.id)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <Bell className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to see notifications</h2>
        <p className="text-gray-400 mb-6">Stay updated on your channel activity</p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-blue-600 hover:bg-blue-700 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Group notifications by type
  const newVideos = notifications?.filter(n => n.type === 'new_video') || [];
  const liveNow = notifications?.filter(n => n.type === 'live_now') || [];
  const interactions = notifications?.filter(n => 
    ['comment_reply', 'mention', 'like', 'subscription'].includes(n.type)
  ) || [];

  const renderNotification = (notification) => {
    const Icon = notificationIcons[notification.type] || Bell;
    
    return (
      <div
        key={notification.id}
        onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
        className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
          notification.read ? "bg-transparent hover:bg-white/5" : "bg-white/5 hover:bg-white/10"
        }`}
      >
        <Avatar className="w-12 h-12">
          <AvatarImage src={notification.source_channel_avatar || notification.thumbnail_url} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Icon className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white">
                <span className="font-semibold">{notification.source_channel_name || "Vidio"}</span>
                {" "}
                <span className="text-gray-400">{notification.message}</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{timeAgo(notification.created_date)}</p>
            </div>
            {notification.thumbnail_url && (
              <div className="w-24 aspect-video rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                <img
                  src={notification.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                className="text-blue-400 hover:text-blue-300"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
            {notifications?.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => clearAllMutation.mutate()}
                className="text-gray-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all
              </Button>
            )}
            <Link to={createPageUrl("Settings")}>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-white/5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications?.length > 0 ? (
              <div className="space-y-1">
                {notifications.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                  <Bell className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
                <p className="text-gray-400">
                  Subscribe to channels to get notified about new content
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {newVideos.length > 0 ? (
              <div className="space-y-1">
                {newVideos.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-20">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No new video notifications</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="live">
            {liveNow.length > 0 ? (
              <div className="space-y-1">
                {liveNow.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-20">
                <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No live notifications</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {interactions.length > 0 ? (
              <div className="space-y-1">
                {interactions.map(renderNotification)}
              </div>
            ) : (
              <div className="text-center py-20">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No activity notifications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}