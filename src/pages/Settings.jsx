import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Camera, 
  ImagePlus,
  Loader2,
  CheckCircle,
  CreditCard,
  Crown
} from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [saved, setSaved] = useState(false);

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

  const [channelData, setChannelData] = useState({
    name: "",
    handle: "",
    description: "",
  });

  React.useEffect(() => {
    if (myChannel) {
      setChannelData({
        name: myChannel.name || "",
        handle: myChannel.handle || "",
        description: myChannel.description || "",
      });
    }
  }, [myChannel]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = myChannel?.avatar_url || "";
      let bannerUrl = myChannel?.banner_url || "";

      if (avatarFile) {
        const result = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = result.file_url;
      }

      if (bannerFile) {
        const result = await base44.integrations.Core.UploadFile({ file: bannerFile });
        bannerUrl = result.file_url;
      }

      if (myChannel) {
        await base44.entities.Channel.update(myChannel.id, {
          name: channelData.name,
          handle: channelData.handle.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          description: channelData.description,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        });
      }
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries(['myChannel']);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="text-6xl mb-4">⚙️</span>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-gray-400 mb-6">You need to sign in to access settings</p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-red-600 hover:bg-red-700 rounded-full px-8"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <Tabs defaultValue="channel" className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="channel" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Channel
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channel">
            {myChannel ? (
              <div className="space-y-6">
                {/* Banner */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Channel Branding</CardTitle>
                    <CardDescription>Customize how your channel looks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Banner Upload */}
                    <div>
                      <Label className="text-white mb-2 block">Banner Image</Label>
                      <div className="relative h-32 rounded-xl overflow-hidden group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerSelect}
                          className="hidden"
                          id="settings-banner"
                        />
                        <label htmlFor="settings-banner" className="cursor-pointer block w-full h-full">
                          {bannerPreview || myChannel.banner_url ? (
                            <img
                              src={bannerPreview || myChannel.banner_url}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white">
                              <ImagePlus className="w-5 h-5" />
                              <span>Change banner</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Avatar Upload */}
                    <div>
                      <Label className="text-white mb-2 block">Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            className="hidden"
                            id="settings-avatar"
                          />
                          <label htmlFor="settings-avatar" className="cursor-pointer block">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={avatarPreview || myChannel.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                                {channelData.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </label>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            Recommended: Square image, at least 800x800px
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Channel Info */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Channel Info</CardTitle>
                    <CardDescription>Basic information about your channel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white mb-2 block">
                        Channel name
                      </Label>
                      <Input
                        id="name"
                        value={channelData.name}
                        onChange={(e) => setChannelData({ ...channelData, name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
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
                          className="bg-white/5 border-white/10 text-white pl-8"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white mb-2 block">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={channelData.description}
                        onChange={(e) => setChannelData({ ...channelData, description: e.target.value })}
                        className="bg-white/5 border-white/10 text-white min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  {saved && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Saved!</span>
                    </div>
                  )}
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-8"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="py-12 text-center">
                  <span className="text-4xl mb-4 block">📺</span>
                  <h3 className="text-xl font-semibold text-white mb-2">No channel yet</h3>
                  <p className="text-gray-400 mb-6">Create a channel to customize your settings</p>
                  <Button className="bg-red-600 hover:bg-red-700 rounded-full px-8">
                    Create Channel
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Subscriptions", description: "Notify me about new videos from channels I subscribe to" },
                  { label: "Recommended videos", description: "Notify me about recommended videos" },
                  { label: "Comments", description: "Notify me when someone replies to my comments" },
                  { label: "Mentions", description: "Notify me when someone mentions me" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Privacy Settings</CardTitle>
                <CardDescription>Manage your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Keep my liked videos private", description: "Only you can see your liked videos" },
                  { label: "Keep my subscriptions private", description: "Only you can see what channels you're subscribed to" },
                  { label: "Keep my watch history private", description: "Your watch history won't affect recommendations" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { 
                  name: "Silver", 
                  price: "$4.99/mo", 
                  features: ["No ads", "Background play", "HD streaming"],
                  color: "from-gray-400 to-gray-500"
                },
                { 
                  name: "Gold", 
                  price: "$9.99/mo", 
                  features: ["All Silver features", "4K streaming", "Offline downloads", "Exclusive content"],
                  color: "from-yellow-500 to-amber-600",
                  popular: true
                },
                { 
                  name: "Pro Creator", 
                  price: "$19.99/mo", 
                  features: ["All Gold features", "Monetization unlocked", "Priority support", "Advanced analytics"],
                  color: "from-purple-500 to-pink-600"
                },
              ].map((plan) => (
                <Card key={plan.name} className={`bg-white/5 border-white/10 relative ${plan.popular ? 'ring-2 ring-yellow-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-2`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-white">{plan.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full rounded-full ${plan.popular ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                      {myChannel?.tier === plan.name.toLowerCase().replace(" ", "_") ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}