import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ImagePlus, Loader2, CheckCircle, Sparkles } from "lucide-react";

export default function CreateChannel() {
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [aiAvatarUrl, setAiAvatarUrl] = useState(null);
  const [aiBannerUrl, setAiBannerUrl] = useState(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  const [channelData, setChannelData] = useState({
    name: "",
    handle: "",
    description: "",
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingChannel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAiAvatarUrl(null);
    }
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setAiBannerUrl(null);
    }
  };

  const generateAvatar = async () => {
    if (!channelData.name.trim()) return;
    setGeneratingAvatar(true);
    setError(null);
    try {
      const prompt = `A professional channel avatar for "${channelData.name}"${channelData.description ? ", " + channelData.description.slice(0, 100) : ""}, modern vibrant digital art, pink and fuchsia gradient style, eye-catching profile picture, centered, ultra detailed`;
      const res = await base44.functions.invoke("aiImageGen", { prompt });
      setAiAvatarUrl(res.data.url);
      setAvatarPreview(res.url);
      setAvatarFile(null);
    } catch (e) {
      setError("Could not generate avatar. Try uploading manually.");
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const generateBanner = async () => {
    if (!channelData.name.trim()) return;
    setGeneratingBanner(true);
    setError(null);
    try {
      const prompt = `A wide cinematic channel banner for "${channelData.name}"${channelData.description ? ", " + channelData.description.slice(0, 100) : ""}, modern vibrant digital art, pink and fuchsia gradient, sweeping landscape, ultra detailed, 16:9 aspect ratio`;
      const res = await base44.functions.invoke("aiImageGen", { prompt });
      setAiBannerUrl(res.data.url);
      setBannerPreview(res.url);
      setBannerFile(null);
    } catch (e) {
      setError("Could not generate banner. Try uploading manually.");
    } finally {
      setGeneratingBanner(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = aiAvatarUrl || "";
      let bannerUrl = aiBannerUrl || "";

      if (avatarFile) {
        const result = await base44.integrations.Core.UploadPublicFile({ file: avatarFile });
        avatarUrl = result.file_url;
      }

      if (bannerFile) {
        const result = await base44.integrations.Core.UploadPublicFile({ file: bannerFile });
        bannerUrl = result.file_url;
      }

      await base44.entities.Channel.create({
        name: channelData.name,
        handle: channelData.handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        description: channelData.description,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        subscribers_count: 0,
        videos_count: 0,
        total_views: 0,
        tier: "free",
        credits: 0,
        verified: false,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 2000);
    },
    onError: () => {
      setError("Something went wrong creating your channel. Please try again.");
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="text-6xl mb-4">🔐</span>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-gray-400 mb-6">You need to sign in to create a channel</p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (existingChannel?.[0]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="text-6xl mb-4">📺</span>
        <h2 className="text-2xl font-bold text-white mb-2">You already have a channel</h2>
        <p className="text-gray-400 mb-6">Visit your channel to manage it</p>
        <Button
          onClick={() => navigate(createPageUrl(`Channel?id=${existingChannel[0].id}`))}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 rounded-full px-8"
        >
          Go to Channel
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Channel Created!</h2>
        <p className="text-gray-400">Redirecting you to home...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Create your channel</h1>
        <p className="text-gray-400 mb-8">
          Set up your channel to start uploading videos
        </p>

        {/* Banner */}
        <div className="relative h-32 md:h-40 rounded-xl overflow-hidden mb-16 group cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerSelect}
            className="hidden"
            id="banner-upload"
          />
          <label htmlFor="banner-upload" className="cursor-pointer block w-full h-full">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" />
            )}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-white bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-medium pointer-events-none">
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{bannerPreview ? "Change" : "Upload"}</span>
            </div>
          </label>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="cursor-pointer block">
                <Avatar className="w-24 h-24 border-4 border-[#0f0f0f]">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl">
                    {channelData.name?.[0] || user?.full_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center border-2 border-[#0f0f0f] pointer-events-none">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* AI generation buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateAvatar}
            disabled={!channelData.name.trim() || generatingAvatar}
            className="rounded-full border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
          >
            {generatingAvatar ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating avatar…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate avatar with AI</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateBanner}
            disabled={!channelData.name.trim() || generatingBanner}
            className="rounded-full border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
          >
            {generatingBanner ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating banner…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate banner with AI</>
            )}
          </Button>
        </div>
        {!channelData.name.trim() && (
          <p className="text-xs text-gray-500 mb-6 -mt-3">Enter a channel name first to enable AI generation.</p>
        )}

        {/* Form */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-white mb-2 block">
              Channel name
            </Label>
            <Input
              id="name"
              value={channelData.name}
              onChange={(e) => setChannelData({ ...channelData, name: e.target.value })}
              placeholder="Your channel name"
              className="bg-white/5 border-white/10 text-white"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="handle" className="text-white mb-2 block">
              Handle
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <Input
                id="handle"
                value={channelData.handle}
                onChange={(e) => setChannelData({ 
                  ...channelData, 
                  handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") 
                })}
                placeholder="yourchannel"
                className="bg-white/5 border-white/10 text-white pl-8"
                maxLength={30}
              />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Only letters, numbers, and underscores
            </p>
          </div>

          <div>
            <Label htmlFor="description" className="text-white mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              value={channelData.description}
              onChange={(e) => setChannelData({ ...channelData, description: e.target.value })}
              placeholder="Tell viewers about your channel"
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
              maxLength={1000}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-right">{error}</p>
          )}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Home"))}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!channelData.name.trim() || !channelData.handle.trim() || createMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 rounded-full px-8"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}