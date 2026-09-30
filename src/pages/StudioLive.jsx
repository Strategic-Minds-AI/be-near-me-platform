import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StudioSidebar from "@/components/studio/StudioSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Radio, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Clock
} from "lucide-react";

export default function StudioLive() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [streamSettings, setStreamSettings] = useState({
    title: "",
    description: "",
    category: "gaming",
    visibility: "public",
    chat_enabled: true,
    chat_mode: "everyone",
    superchat_enabled: true,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: existingStreams } = useQuery({
    queryKey: ['myStreams', channel?.[0]?.id],
    queryFn: () => base44.entities.LiveStream.filter(
      { channel_id: channel?.[0]?.id },
      "-created_date",
      10
    ),
    enabled: !!channel?.[0]?.id,
  });

  const myChannel = channel?.[0];

  // Generate a stream key (in production, this would be from your streaming service)
  const streamKey = myChannel?.id 
    ? `live_${myChannel.id.substring(0, 8)}_${Date.now().toString(36)}`
    : "";

  const rtmpUrl = "rtmp://live.vidio.app/live";

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const stream = await base44.entities.LiveStream.create({
        channel_id: myChannel.id,
        title: streamSettings.title,
        description: streamSettings.description,
        category: streamSettings.category,
        visibility: streamSettings.visibility,
        stream_key: streamKey,
        rtmp_url: rtmpUrl,
        status: "scheduled",
        chat_enabled: streamSettings.chat_enabled,
        chat_mode: streamSettings.chat_mode,
        superchat_enabled: streamSettings.superchat_enabled,
        viewers_current: 0,
        viewers_peak: 0,
        total_views: 0,
        likes: 0,
        channel_name: myChannel.name,
        channel_avatar: myChannel.avatar_url,
      });
      return stream;
    },
    onSuccess: (stream) => {
      queryClient.invalidateQueries(['myStreams']);
      // In production, would redirect to stream control page
    },
  });

  const goLiveMutation = useMutation({
    mutationFn: async (streamId) => {
      await base44.entities.LiveStream.update(streamId, {
        status: "live",
        actual_start: new Date().toISOString(),
      });
      return streamId;
    },
    onSuccess: (streamId) => {
      queryClient.invalidateQueries(['myStreams']);
      navigate(createPageUrl(`LiveWatch?id=${streamId}`));
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async (streamId) => {
      await base44.entities.LiveStream.update(streamId, {
        status: "ended",
        ended_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myStreams']);
    },
  });

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeStream = existingStreams?.find(s => s.status === "live" || s.status === "scheduled");

  const categories = [
    { value: "gaming", label: "Gaming" },
    { value: "music", label: "Music" },
    { value: "entertainment", label: "Entertainment" },
    { value: "education", label: "Education" },
    { value: "sports", label: "Sports" },
    { value: "tech", label: "Tech" },
    { value: "vlogs", label: "Vlogs" },
    { value: "other", label: "Other" },
  ];

  if (!myChannel) {
    return (
      <div className="flex min-h-screen bg-[#0f0f0f]">
        <StudioSidebar currentPage="StudioLive" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Create a channel first</h2>
            <p className="text-gray-400 mb-4">You need a channel to go live</p>
            <Button
              onClick={() => navigate(createPageUrl("CreateChannel"))}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Create Channel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioLive" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Live Streaming</h1>
              <p className="text-gray-400">Broadcast live to your audience</p>
            </div>
          </div>

          {/* Active Stream */}
          {activeStream && (
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeStream.status === "live" ? (
                      <Badge className="bg-red-600 text-white animate-pulse">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-600 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Scheduled
                      </Badge>
                    )}
                    <CardTitle className="text-white">{activeStream.title}</CardTitle>
                  </div>
                  {activeStream.status === "live" && (
                    <Badge className="bg-white/10 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      {activeStream.viewers_current || 0} viewers
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {activeStream.status === "scheduled" && (
                    <Button
                      onClick={() => goLiveMutation.mutate(activeStream.id)}
                      disabled={goLiveMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {goLiveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Radio className="w-4 h-4 mr-2" />
                      )}
                      Go Live
                    </Button>
                  )}
                  {activeStream.status === "live" && (
                    <>
                      <Button
                        onClick={() => navigate(createPageUrl(`LiveWatch?id=${activeStream.id}`))}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Stream
                      </Button>
                      <Button
                        onClick={() => endStreamMutation.mutate(activeStream.id)}
                        variant="destructive"
                      >
                        End Stream
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stream Setup */}
          {!activeStream && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Stream Details</CardTitle>
                  <CardDescription>Set up your live stream</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Title</Label>
                    <Input
                      value={streamSettings.title}
                      onChange={(e) => setStreamSettings({ ...streamSettings, title: e.target.value })}
                      placeholder="Enter stream title"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={streamSettings.description}
                      onChange={(e) => setStreamSettings({ ...streamSettings, description: e.target.value })}
                      placeholder="Tell viewers about your stream"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Category</Label>
                      <Select
                        value={streamSettings.category}
                        onValueChange={(v) => setStreamSettings({ ...streamSettings, category: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] border-white/10">
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Visibility</Label>
                      <Select
                        value={streamSettings.visibility}
                        onValueChange={(v) => setStreamSettings({ ...streamSettings, visibility: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#212121] border-white/10">
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stream Settings */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Stream Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Live Chat</p>
                      <p className="text-gray-400 text-sm">Allow viewers to chat during stream</p>
                    </div>
                    <Switch
                      checked={streamSettings.chat_enabled}
                      onCheckedChange={(c) => setStreamSettings({ ...streamSettings, chat_enabled: c })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Super Chat</p>
                      <p className="text-gray-400 text-sm">Allow paid messages from viewers</p>
                    </div>
                    <Switch
                      checked={streamSettings.superchat_enabled}
                      onCheckedChange={(c) => setStreamSettings({ ...streamSettings, superchat_enabled: c })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Encoder Setup */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Encoder Setup</CardTitle>
                  <CardDescription>Use these settings in OBS or your streaming software</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Stream URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={rtmpUrl}
                        readOnly
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(rtmpUrl)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Stream Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={showStreamKey ? streamKey : "••••••••••••••••••••"}
                        readOnly
                        className="bg-white/5 border-white/10 text-white font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setShowStreamKey(!showStreamKey)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(streamKey)}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Never share your stream key with anyone
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Create Stream Button */}
              <Button
                onClick={() => createStreamMutation.mutate()}
                disabled={!streamSettings.title.trim() || createStreamMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
              >
                {createStreamMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Radio className="w-5 h-5 mr-2" />
                    Create Stream
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}