import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Target, Send, Inbox, ArrowUpRight, Upload, CheckCircle2, XCircle, Clock, Coins, Video } from "lucide-react";

const CATEGORIES = [
  { value: "kindness", label: "Kindness" },
  { value: "fitness", label: "Fitness" },
  { value: "creativity", label: "Creativity" },
  { value: "community", label: "Community" },
  { value: "environment", label: "Environment" },
  { value: "learning", label: "Learning" },
  { value: "bravery", label: "Bravery" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-indigo-500/20 text-indigo-400",
  submitted: "bg-purple-500/20 text-purple-400",
  verified: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  expired: "bg-gray-500/20 text-gray-400",
  declined: "bg-gray-500/20 text-gray-400",
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function Dares() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [proofDareId, setProofDareId] = useState(null);
  const [form, setForm] = useState({
    challenger_email: "",
    challenge_text: "",
    category: "kindness",
    infinity_coin_stake: 10,
    expires_days: 7,
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: incomingDares, isLoading: incLoading } = useQuery({
    queryKey: ["incomingDares", user?.email],
    queryFn: () => base44.entities.Dare.filter({ challenger_email: user.email }, { sort: "-created_date", limit: 50 }),
    enabled: !!user?.email,
  });

  const { data: outgoingDares, isLoading: outLoading } = useQuery({
    queryKey: ["outgoingDares", user?.email],
    queryFn: () => base44.entities.Dare.filter({ initiator_email: user.email }, { sort: "-created_date", limit: 50 }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Dare.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["outgoingDares"]);
      toast({ title: "Dare sent! 🎯", description: "Your kindness dare is on its way." });
      setForm({ challenger_email: "", challenge_text: "", category: "kindness", infinity_coin_stake: 10, expires_days: 7 });
    },
    onError: () => toast({ title: "Could not send dare", variant: "destructive" }),
  });

  const updateDareMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.Dare.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["incomingDares"]);
      queryClient.invalidateQueries(["outgoingDares"]);
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ file, dareId }) => {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      return base44.entities.Dare.update(dareId, {
        video_url: res.file_url,
        status: "submitted",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["incomingDares"]);
      setProofDareId(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Proof submitted! ✅", description: "Your video is being reviewed." });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" }),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.challenger_email.trim() || !form.challenge_text.trim()) return;
    const expires = new Date();
    expires.setDate(expires.getDate() + Number(form.expires_days));
    createMutation.mutate({
      initiator_email: user.email,
      challenger_email: form.challenger_email.trim(),
      challenge_text: form.challenge_text.trim(),
      category: form.category,
      infinity_coin_stake: Number(form.infinity_coin_stake),
      expires_at: expires.toISOString(),
      status: "pending",
    });
  };

  const handleAccept = (dare) => {
    updateDareMutation.mutate({ id: dare.id, data: { status: "accepted" } });
    toast({ title: "Dare accepted! 💪", description: "Go spread some kindness." });
  };

  const handleDecline = (dare) => {
    updateDareMutation.mutate({ id: dare.id, data: { status: "declined" } });
    toast({ title: "Dare declined" });
  };

  const handleProofUpload = (e, dareId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadProofMutation.mutate({ file, dareId });
  };

  const handleVerify = (dare) => {
    updateDareMutation.mutate({
      id: dare.id,
      data: { video_verified: true, status: "verified", verification_note: "Verified by initiator.", completed_at: new Date().toISOString() },
    });
    toast({ title: "Dare verified! 🎉", description: "Reward is ready to process." });
  };

  const handleProcessReward = async (dare) => {
    try {
      await base44.functions.invoke("processReward", { dare_id: dare.id });
      queryClient.invalidateQueries(["incomingDares"]);
      queryClient.invalidateQueries(["outgoingDares"]);
      toast({ title: "Reward processed! 🪙", description: "Infinity Coin has been sent." });
    } catch (err) {
      toast({ title: "Reward failed", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f] text-white p-6">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-pink-500" />
          <p className="text-gray-400 mb-4">Sign in to start daring.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const DareCard = ({ dare, incoming }) => (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={STATUS_COLORS[dare.status]}>{dare.status.replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="border-white/20 text-gray-400 capitalize">{dare.category}</Badge>
            </div>
            <p className="text-white font-medium mt-2">{dare.challenge_text}</p>
          </div>
          <div className="flex items-center gap-1 text-pink-400 shrink-0">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-bold">{dare.infinity_coin_stake}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>{incoming ? `From: ${dare.initiator_email}` : `To: ${dare.challenger_email}`}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires {formatDate(dare.expires_at)}</span>
        </div>
        {dare.video_url && (
          <div className="mb-3 rounded-lg overflow-hidden bg-white/5">
            <video src={dare.video_url} controls className="w-full max-h-48 object-contain" />
          </div>
        )}
        {dare.verification_note && (
          <p className="text-xs text-gray-400 mb-3 italic">"{dare.verification_note}"</p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {incoming && dare.status === "pending" && (
            <>
              <Button size="sm" onClick={() => handleAccept(dare)} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDecline(dare)} className="rounded-full border-white/20 text-white">
                <XCircle className="w-4 h-4 mr-1" /> Decline
              </Button>
            </>
          )}
          {incoming && (dare.status === "accepted" || dare.status === "in_progress") && !dare.video_url && (
            <Button size="sm" onClick={() => setProofDareId(dare.id)} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">
              <Upload className="w-4 h-4 mr-1" /> Upload Proof
            </Button>
          )}
          {!incoming && dare.status === "submitted" && !dare.video_verified && (
            <Button size="sm" onClick={() => handleVerify(dare)} className="bg-green-600 hover:bg-green-700 rounded-full">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
            </Button>
          )}
          {!incoming && dare.status === "verified" && !dare.reward_paid && (
            <Button size="sm" onClick={() => handleProcessReward(dare)} className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">
              <Coins className="w-4 h-4 mr-1" /> Pay Reward
            </Button>
          )}
          {incoming && dare.status === "verified" && dare.reward_paid && (
            <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Reward received!</Badge>
          )}
        </div>

        {proofDareId === dare.id && (
          <div className="mt-3 p-3 rounded-lg bg-white/5 border border-pink-500/20">
            <Label className="text-sm text-gray-300">Upload your proof video</Label>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleProofUpload(e, dare.id)}
              className="mt-2 w-full text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-pink-500 file:text-white file:cursor-pointer"
            />
            {uploadProofMutation.isPending && <p className="text-xs text-gray-400 mt-2">Uploading...</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f0f0f] text-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kindness Dares</h1>
            <p className="text-gray-400 text-sm">Dare friends to spread kindness. Stake Infinity Coin on their courage.</p>
          </div>
        </div>

        <Tabs defaultValue="create">
          <TabsList className="bg-white/5 grid grid-cols-3 w-full">
            <TabsTrigger value="create" className="flex items-center gap-1.5"><Send className="w-4 h-4" /> Create</TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-1.5"><Inbox className="w-4 h-4" /> Incoming</TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-1.5"><ArrowUpRight className="w-4 h-4" /> Outgoing</TabsTrigger>
          </TabsList>

          {/* Create */}
          <TabsContent value="create">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Send a Kindness Dare</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Who do you want to dare? (email)</Label>
                    <Input
                      type="email"
                      value={form.challenger_email}
                      onChange={(e) => setForm({ ...form, challenger_email: e.target.value })}
                      placeholder="friend@example.com"
                      className="mt-1 bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">What's the kindness dare?</Label>
                    <Textarea
                      value={form.challenge_text}
                      onChange={(e) => setForm({ ...form, challenge_text: e.target.value })}
                      placeholder="Hold the door open for 30 people and film it!"
                      className="mt-1 bg-white/5 border-white/10 text-white min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-gray-400">Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#212121] border-white/10">
                          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-400">Stake (Infinity)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.infinity_coin_stake}
                        onChange={(e) => setForm({ ...form, infinity_coin_stake: e.target.value })}
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400">Days to complete</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={form.expires_days}
                        onChange={(e) => setForm({ ...form, expires_days: e.target.value })}
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full h-12">
                    {createMutation.isPending ? "Sending..." : "Send Dare 🎯"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incoming */}
          <TabsContent value="incoming" className="space-y-3">
            {incLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : incomingDares?.length === 0 ? (
              <Card className="bg-white/5 border-white/10"><CardContent className="pt-10 pb-10 text-center text-gray-500">No dares yet. When someone dares you, it'll show up here!</CardContent></Card>
            ) : (
              incomingDares?.map((dare) => <DareCard key={dare.id} dare={dare} incoming />)
            )}
          </TabsContent>

          {/* Outgoing */}
          <TabsContent value="outgoing" className="space-y-3">
            {outLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : outgoingDares?.length === 0 ? (
              <Card className="bg-white/5 border-white/10"><CardContent className="pt-10 pb-10 text-center text-gray-500">You haven't sent any dares yet. Create one!</CardContent></Card>
            ) : (
              outgoingDares?.map((dare) => <DareCard key={dare.id} dare={dare} incoming={false} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}