import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Shield, 
  Users, 
  Video, 
  Flag, 
  BarChart3,
  MoreVertical,
  Trash2,
  Ban,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  TrendingUp,
  PlaySquare,
  Sparkles,
  Code,
  CheckCircle2,
  Megaphone,
  Film,
  Coins,
  Heart,
  Scale,
  Network,
  Wallet
} from "lucide-react";

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num?.toString() || "0";
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400",
  reviewed: "bg-blue-500/20 text-blue-400",
  action_taken: "bg-green-500/20 text-green-400",
  dismissed: "bg-gray-500/20 text-gray-400",
};

export default function Admin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['adminVideos'],
    queryFn: () => base44.entities.Video.list("-created_date", 100),
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['adminChannels'],
    queryFn: () => base44.entities.Channel.list("-created_date", 100),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => base44.entities.Report.list("-created_date", 100),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId) => {
      await base44.entities.Video.delete(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminVideos']);
      setSelectedVideo(null);
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }) => {
      await base44.entities.Report.update(reportId, { status, admin_notes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminReports']);
      setSelectedReport(null);
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-24 h-24 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <Shield className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-center max-w-md">
          You don't have permission to access the admin panel. 
          Contact an administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  // Stats
  const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
  const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;

  const filteredVideos = videos?.filter(v => 
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.channel_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Videos", value: videos?.length || 0, icon: Video, color: "from-blue-500 to-cyan-500" },
            { label: "Total Channels", value: channels?.length || 0, icon: Users, color: "from-purple-500 to-pink-500" },
            { label: "Total Views", value: formatCount(totalViews), icon: TrendingUp, color: "from-green-500 to-emerald-500" },
            { label: "Pending Reports", value: pendingReports, icon: Flag, color: "from-red-500 to-orange-500" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Reports
              {pendingReports > 0 && (
                <Badge className="ml-1 bg-red-500">{pendingReports}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Architecture
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Agents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Video Management</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Video</TableHead>
                      <TableHead className="text-gray-400">Channel</TableHead>
                      <TableHead className="text-gray-400">Views</TableHead>
                      <TableHead className="text-gray-400">Visibility</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow key={video.id} className="border-white/10">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-16 aspect-video rounded bg-white/5 overflow-hidden">
                              {video.thumbnail_url ? (
                                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PlaySquare className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <span className="text-white font-medium line-clamp-1 max-w-[200px]">
                              {video.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">{video.channel_name}</TableCell>
                        <TableCell className="text-gray-400">{formatCount(video.views || 0)}</TableCell>
                        <TableCell>
                          <Badge className={
                            video.visibility === 'public' 
                              ? 'bg-green-500/20 text-green-400' 
                              : video.visibility === 'private'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }>
                            {video.visibility}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(video.created_date)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Eye className="w-4 h-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setSelectedVideo(video)}
                                className="flex items-center gap-2 cursor-pointer text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Channel Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Channel</TableHead>
                      <TableHead className="text-gray-400">Handle</TableHead>
                      <TableHead className="text-gray-400">Subscribers</TableHead>
                      <TableHead className="text-gray-400">Videos</TableHead>
                      <TableHead className="text-gray-400">Tier</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                      <TableHead className="text-gray-400 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels?.map((channel) => (
                      <TableRow key={channel.id} className="border-white/10">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                              {channel.name?.[0] || "?"}
                            </div>
                            <span className="text-white font-medium">{channel.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">@{channel.handle}</TableCell>
                        <TableCell className="text-gray-400">{formatCount(channel.subscribers_count || 0)}</TableCell>
                        <TableCell className="text-gray-400">{channel.videos_count || 0}</TableCell>
                        <TableCell>
                          <Badge className="bg-white/10 text-white capitalize">{channel.tier || 'free'}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(channel.created_date)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Eye className="w-4 h-4" />
                                View Channel
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-400">
                                <Ban className="w-4 h-4" />
                                Ban Channel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Content Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Reason</TableHead>
                      <TableHead className="text-gray-400">Details</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports?.map((report) => (
                      <TableRow key={report.id} className="border-white/10">
                        <TableCell>
                          <Badge className="bg-white/10 text-white capitalize">{report.target_type}</Badge>
                        </TableCell>
                        <TableCell className="text-white capitalize">{report.reason?.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-gray-400 max-w-[200px] truncate">{report.details || '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[report.status] || statusColors.pending}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(report.created_date)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedReport(report)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            {/* Vision */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  The Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-300 text-sm leading-relaxed">
                <p>
                  <span className="text-white font-medium">Be Near Me</span> is a positivity-only truth-or-dare platform that inspires young people to help other people. Users dare each other to complete kindness challenges — hold the door for 30 people, help a neighbor, clean up a park — and earn <span className="text-pink-400">Infinity Coin</span> crypto rewards for completing them. They can also initiate truths, asking someone to share a deep truth and staking coin on their courage to reveal it.
                </p>
                <p>
                  The platform is <span className="text-white font-medium">anti-hierarchical</span> — every user is an equal peer. It is <span className="text-white font-medium">positivity-only</span> — zero negativity, shame, or bullying, ever. Every user gets a crypto wallet, an AI Buddy, and chooses a charity at signup so participation always gives back.
                </p>
                <p>
                  Governance is a <span className="text-white font-medium">3-strike system</span>: a slap on the wrist, a 5-day timeout, then removal with tokens evenly redistributed to other users and 10% donated to charity. After 6 months, removed users can petition for re-annihilation — a clean slate.
                </p>
              </CardContent>
            </Card>

            {/* Strategy */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  The Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-300 text-sm">
                {[
                  { t: "Lead with kindness", d: "Market the kindness mission first; crypto is the reward, not the hook. Target young creators seeking a kinder alternative to toxic social media." },
                  { t: "Supply-side growth", d: "Onboard creators first — more kindness dares mean a better feed, which retains viewers. Use the AI Video Studio to lower the barrier to creating content." },
                  { t: "Crypto as incentive, not speculation", d: "Infinity Coin rewards verified kindness. Frame it as a game reward, never an investment. Keep wallets client-side and non-custodial." },
                  { t: "Charity as moat", d: "Every user picks a charity at signup. 10% of removed users' tokens go to charity. This makes participation feel good even for viewers who never earn coin." },
                  { t: "Positivity as product", d: "The 3-strike system and AI moderation make Be Near Me the safest social space for young people. Safety is the differentiator, not a feature." },
                  { t: "Agent-driven operations", d: "10 autonomous agents handle validation, governance, moderation, marketing, video, crypto, positivity, legal, coding, and personal companionship — keeping the platform running with minimal human overhead." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-pink-500 font-bold shrink-0">{i + 1}.</span>
                    <div>
                      <span className="text-white font-medium">{s.t}.</span> <span className="text-gray-400">{s.d}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Architecture */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-pink-500" />
                  System Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-white font-medium mb-2">Core Entities</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Video", "Channel", "Dare", "Truth", "Strike", "Wallet", "Token", "Comment", "Reaction", "Subscription", "CommunityPost", "Report", "DigitalSignature", "LegalReference", "Notification", "CreatorReputation"].map((e) => (
                      <span key={e} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs text-center">{e}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium mb-2">Key User Flows</p>
                  <div className="space-y-2 text-gray-400">
                    <p><span className="text-pink-400">Onboarding:</span> Sign in → Choose charity → Set up wallet → Meet AI Buddy → Read rules → Digital signature → Feed</p>
                    <p><span className="text-pink-400">Kindness Dare:</span> User A creates dare + stakes Infinity Coin → User B accepts → User B records proof video → Validator agent verifies → Reward paid</p>
                    <p><span className="text-pink-400">Truth Share:</span> User A asks truth + stakes coin → User B accepts → User B reveals → Reward paid (or forfeited if declined)</p>
                    <p><span className="text-pink-400">Governance:</span> Moderation agent flags violation → Governance agent issues strike → Strike 3 = removal + token redistribution + 10% to charity</p>
                    <p><span className="text-pink-400">Re-annihilation:</span> Removed user waits 6 months → Petitions for return → Admin reviews → Clean slate</p>
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium mb-2">Infrastructure</p>
                  <div className="space-y-1 text-gray-400">
                    <p>• Frontend: React + Tailwind + shadcn/ui (TikTok-style vertical feed)</p>
                    <p>• Backend: Base44 entities, backend functions, workflows, agents</p>
                    <p>• Crypto: Client-side ethers.js wallet generation (mainnet + sepolia testnet)</p>
                    <p>• AI: 10 autonomous agents + AI Video Studio with 10 presets</p>
                    <p>• Analytics: GA4 connected for traffic monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Agent Suite — 10 Autonomous Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Sparkles, name: "AI Buddy", color: "from-pink-500 to-fuchsia-600", desc: "Personal positivity companion for every user. Inspires kindness dares, guides good choices, and keeps things uplifting." },
                    { icon: Code, name: "Coding Agent", color: "from-blue-500 to-cyan-500", desc: "Autonomous development planner. Breaks down features, tracks architecture, and guides the build." },
                    { icon: CheckCircle2, name: "Validator Agent", color: "from-green-500 to-emerald-500", desc: "Verifies dare proof videos match the original dare spec before Infinity Coin rewards are paid." },
                    { icon: Shield, name: "Governance Agent", color: "from-red-500 to-orange-500", desc: "Enforces the 3-strike system with empathy. Manages warnings, timeouts, removals, and token redistribution." },
                    { icon: Megaphone, name: "Marketing Agent", color: "from-purple-500 to-pink-500", desc: "Creates social content, creator outreach, and growth campaigns that spread kindness virally." },
                    { icon: Film, name: "Video Agent", color: "from-indigo-500 to-blue-500", desc: "Manages video processing, AI generation presets, and the video lifecycle for the vertical feed." },
                    { icon: Coins, name: "Crypto Agent", color: "from-yellow-500 to-amber-500", desc: "Manages wallets, Infinity Coin rewards, token distribution, and ERC-20 token generation." },
                    { icon: Heart, name: "Positivity Agent", color: "from-rose-500 to-pink-500", desc: "Monitors platform positivity health, sends uplifting nudges, and reinforces the kindness ethos." },
                    { icon: Eye, name: "Moderation Agent", color: "from-orange-500 to-red-500", desc: "Identifies bullying, negativity, and rule violations — the first line of defense for community safety." },
                    { icon: Scale, name: "Legal Agent", color: "from-slate-400 to-slate-600", desc: "Researches and catalogs laws across crypto, minor safety, privacy, charity, and digital signatures." },
                  ].map((a) => (
                    <div key={a.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                          <a.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-medium">{a.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{a.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-4 text-center">
                  Agents are managed in the dashboard. AI Buddy has an in-app chat UI; others operate via dashboard and backend automation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Video Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="bg-[#212121] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Video</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedVideo?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedVideo(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteVideoMutation.mutate(selectedVideo?.id)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Review Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="bg-[#212121] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Review Report</DialogTitle>
              <DialogDescription>
                Review this report and take action
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="text-white capitalize">{selectedReport?.target_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Reason</p>
                <p className="text-white capitalize">{selectedReport?.reason?.replace(/_/g, ' ')}</p>
              </div>
              {selectedReport?.details && (
                <div>
                  <p className="text-sm text-gray-400">Details</p>
                  <p className="text-white">{selectedReport.details}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => updateReportMutation.mutate({ 
                  reportId: selectedReport?.id, 
                  status: 'dismissed' 
                })}
                className="text-gray-400"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
              <Button 
                onClick={() => updateReportMutation.mutate({ 
                  reportId: selectedReport?.id, 
                  status: 'action_taken' 
                })}
                className="bg-red-600 hover:bg-red-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Take Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}