import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon,
  Film,
  ImagePlus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import AIAssistant from "@/components/upload/AIAssistant";

const categories = [
  { value: "gaming", label: "Gaming" },
  { value: "music", label: "Music" },
  { value: "vlogs", label: "Vlogs" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "sports", label: "Sports" },
  { value: "news", label: "News" },
  { value: "tech", label: "Tech" },
  { value: "comedy", label: "Comedy" },
  { value: "film", label: "Film & Animation" },
  { value: "howto", label: "How-to & Style" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "fashion", label: "Fashion" },
  { value: "art", label: "Art" },
  { value: "science", label: "Science" },
  { value: "pets", label: "Pets & Animals" },
  { value: "autos", label: "Autos & Vehicles" },
  { value: "other", label: "Other" },
];

export default function Upload() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    visibility: "public",
    monetized: false,
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

  const myChannel = channel?.[0];

  const handleVideoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setUploadError("Please select a valid video file");
        return;
      }
      setVideoFile(file);
      setVideoData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
      setStep(2);
      setUploadError(null);
    }
  }, []);

  const handleThumbnailSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select a valid image file");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ""),
      }));
      setStep(2);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      setUploadProgress(10);

      // Upload video
      const videoResult = await base44.integrations.Core.UploadFile({ file: videoFile });
      setUploadProgress(50);

      // Upload thumbnail if provided
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const thumbResult = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
        thumbnailUrl = thumbResult.file_url;
      }
      setUploadProgress(70);

      // Create video record
      const tags = videoData.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t);

      const newVideo = await base44.entities.Video.create({
        title: videoData.title,
        description: videoData.description,
        url: videoResult.file_url,
        thumbnail_url: thumbnailUrl,
        category: videoData.category,
        tags,
        visibility: videoData.visibility,
        monetized: videoData.monetized,
        processing_status: "done",
        channel_id: myChannel?.id,
        channel_name: myChannel?.name || user?.full_name,
        channel_avatar: myChannel?.avatar_url || "",
        views: 0,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        published_at: new Date().toISOString(),
      });

      // Notify subscribers
      const subscriptions = await base44.entities.Subscription.filter({ channel_id: myChannel.id });
      if (subscriptions?.length > 0) {
        await Promise.all(subscriptions.slice(0, 50).map(sub => 
          base44.entities.Notification.create({
            type: "new_video",
            title: "New video",
            message: `uploaded: ${videoData.title}`,
            thumbnail_url: thumbnailUrl,
            action_url: `/Watch?v=${newVideo.id}`,
            source_channel_id: myChannel.id,
            source_channel_name: myChannel.name,
            source_channel_avatar: myChannel.avatar_url,
            video_id: newVideo.id,
            created_by: sub.created_by,
          })
        ));
      }

      // Update channel video count
      if (myChannel) {
        await base44.entities.Channel.update(myChannel.id, {
          videos_count: (myChannel.videos_count || 0) + 1,
        });
      }

      setUploadProgress(100);
    },
    onSuccess: () => {
      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 1500);
    },
    onError: (error) => {
      setUploadError(error.message || "Upload failed. Please try again.");
      setIsUploading(false);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="text-6xl mb-4">🔐</span>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-gray-400 mb-6">You need to sign in to upload videos</p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-red-600 hover:bg-red-700 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (!myChannel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="text-6xl mb-4">📺</span>
        <h2 className="text-2xl font-bold text-white mb-2">Create a channel first</h2>
        <p className="text-gray-400 mb-6">You need a channel to upload videos</p>
        <Button
          onClick={() => navigate(createPageUrl("CreateChannel"))}
          className="bg-red-600 hover:bg-red-700 rounded-full px-8"
        >
          Create Channel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Upload Video</h1>

        {step === 1 && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <UploadIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drag and drop video files to upload
              </h3>
              <p className="text-gray-400 mb-6">
                Your videos will be private until you publish them
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">
                Select Files
              </Button>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Video Preview */}
            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-32 h-20 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Film className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{videoFile?.name}</p>
                <p className="text-gray-400 text-sm">
                  {(videoFile?.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setVideoFile(null);
                  setStep(1);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-medium">
                    {uploadProgress < 100 ? "Uploading..." : "Upload complete!"}
                  </span>
                  <span className="text-gray-400">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {uploadProgress === 100 && (
                  <div className="flex items-center gap-2 mt-4 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Video uploaded successfully! Redirecting...</span>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400">{uploadError}</span>
              </div>
            )}

            {/* Form */}
            {!isUploading && (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-white mb-2 block">
                      Title (required)
                    </Label>
                    <Input
                      id="title"
                      value={videoData.title}
                      onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                      placeholder="Add a title that describes your video"
                      className="bg-white/5 border-white/10 text-white"
                      maxLength={100}
                    />
                    <p className="text-gray-500 text-sm mt-1">
                      {videoData.title.length}/100
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={videoData.description}
                      onChange={(e) => setVideoData({ ...videoData, description: e.target.value })}
                      placeholder="Tell viewers about your video"
                      className="bg-white/5 border-white/10 text-white min-h-[150px]"
                      maxLength={5000}
                    />
                    <p className="text-gray-500 text-sm mt-1">
                      {videoData.description.length}/5000
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Category</Label>
                      <Select
                        value={videoData.category}
                        onValueChange={(value) => setVideoData({ ...videoData, category: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select category" />
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
                      <Label className="text-white mb-2 block">Visibility</Label>
                      <Select
                        value={videoData.visibility}
                        onValueChange={(value) => setVideoData({ ...videoData, visibility: value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
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

                  <div>
                    <Label htmlFor="tags" className="text-white mb-2 block">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={videoData.tags}
                      onChange={(e) => setVideoData({ ...videoData, tags: e.target.value })}
                      placeholder="gaming, tutorial, vlog (comma separated)"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  {/* AI Assistant */}
                  <AIAssistant
                    videoTitle={videoData.title}
                    videoCategory={videoData.category}
                    onApply={(field, value) => setVideoData(prev => ({ ...prev, [field]: value }))}
                  />

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">Monetization</p>
                      <p className="text-gray-400 text-sm">Enable ads on this video</p>
                    </div>
                    <Switch
                      checked={videoData.monetized}
                      onCheckedChange={(checked) => setVideoData({ ...videoData, monetized: checked })}
                    />
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <Label className="text-white mb-2 block">Thumbnail</Label>
                  <div className="aspect-video bg-white/5 rounded-xl overflow-hidden relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label htmlFor="thumbnail-upload" className="cursor-pointer block w-full h-full">
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-400 text-sm">Upload thumbnail</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium">Change</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Recommended: 1280x720 (16:9)
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isUploading && (
              <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setVideoFile(null);
                    setStep(1);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!videoData.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full px-8"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}