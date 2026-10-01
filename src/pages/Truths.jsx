import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircleHeart, Send, Inbox, ArrowUpRight, CheckCircle2, XCircle, Clock, Coins } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-blue-500/20 text-blue-400",
  revealed: "bg-green-500/20 text-green-400",
  declined: "bg-gray-500/20 text-gray-400",
  expired: "bg-gray-500/20 text-gray-400",
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * @typedef {{
 *   responder_email: string,
 *   truth_prompt: string,
 *   infinity_coin_stake: number,
 *   expires_days: number
 * }} TruthCreateInput
 */

/**
 * @typedef {{
 *   truthId: string,
 *   action: string,
 *   response_text?: string
 * }} TruthTransitionInput
 */

/** @param {TruthCreateInput} data */
function createTruth(data) {
  return base44.functions.invoke("updateTruthState", { action: "create", ...data });
}

/** @param {TruthTransitionInput} transition */
function transitionTruth(transition) {
  const { truthId, action, ...payload } = transition;
  return base44.functions.invoke("updateTruthState", { truth_id: truthId, action, ...payload });
}

export default function Truths() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ responder_email: "", truth_prompt: "", infinity_coin_stake: 10, expires_days: 7 });
  const [revealText, setRevealText] = useState({});

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: incoming, isLoading: incLoading } = useQuery({
    queryKey: ["incomingTruths", user?.email],
    queryFn: async () => (await base44.entities.Truth.filter({ responder_email: user.email }, { sort: "-created_date", limit: 50 })).items,
    enabled: !!user?.email,
  });

  const { data: outgoing, isLoading: outLoading } = useQuery({
    queryKey: ["outgoingTruths", user?.email],
    queryFn: async () => (await base44.entities.Truth.filter({ initiator_email: user.email }, { sort: "-created_date", limit: 50 })).items,
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: createTruth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingTruths"] });
      toast({ title: "Truth sent! 💬", description: "Waiting for a courageous reveal." });
      setForm({ responder_email: "", truth_prompt: "", infinity_coin_stake: 10, expires_days: 7 });
    },
    onError: () => toast({ title: "Could not send", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: transitionTruth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingTruths"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingTruths"] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.responder_email.trim() || !form.truth_prompt.trim()) return;
    createMutation.mutate({
      responder_email: form.responder_email.trim(),
      truth_prompt: form.truth_prompt.trim(),
      infinity_coin_stake: Number(form.infinity_coin_stake),
      expires_days: Number(form.expires_days),
    });
  };

  const handleAccept = (truth) => {
    updateMutation.mutate({ truthId: truth.id, action: "accept" });
    toast({ title: "Truth accepted! 💪" });
  };

  const handleDecline = (truth) => {
    updateMutation.mutate({ truthId: truth.id, action: "decline" });
    toast({ title: "Truth declined" });
  };

  const handleReveal = (truth) => {
    const text = revealText[truth.id]?.trim();
    if (!text) return;
    updateMutation.mutate({ truthId: truth.id, action: "reveal", response_text: text });
    toast({ title: "Truth revealed! 🎉", description: "Your courage earned the reward." });
  };

  const handleProcessReward = async (truth) => {
    try {
      await base44.functions.invoke("processReward", { truth_id: truth.id });
      queryClient.invalidateQueries({ queryKey: ["incomingTruths"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingTruths"] });
      toast({ title: "Reward recorded 🪙", description: "Recorded in Be Near Me; no blockchain transfer was performed." });
    } catch {
      toast({ title: "Reward failed", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f] text-white p-6">
        <div className="text-center">
          <MessageCircleHeart className="w-12 h-12 mx-auto mb-4 text-pink-500" />
          <p className="text-gray-400 mb-4">Sign in to share truths.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">Sign In</Button>
        </div>
      </div>
    );
  }

  const TruthCard = ({ truth, isIncoming }) => (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={STATUS_COLORS[truth.status]}>{truth.status}</Badge>
            </div>
            <p className="text-white font-medium mt-2 italic">"{truth.truth_prompt}"</p>
          </div>
          <div className="flex items-center gap-1 text-pink-400 shrink-0">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-bold">{truth.infinity_coin_stake}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>{isIncoming ? `From: ${truth.initiator_email}` : `To: ${truth.responder_email}`}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires {formatDate(truth.expires_at)}</span>
        </div>

        {truth.response_text && (
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 mb-3">
            <p className="text-xs text-gray-400 mb-1">Reveal:</p>
            <p className="text-white text-sm">{truth.response_text}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {isIncoming && truth.status === "pending" && (
            <>
              <Button size="sm" onClick={() => handleAccept(truth)} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDecline(truth)} className="rounded-full border-white/20 text-white">
                <XCircle className="w-4 h-4 mr-1" /> Decline
              </Button>
            </>
          )}
          {isIncoming && truth.status === "accepted" && !truth.response_text && (
            <div className="w-full">
              <Textarea
                value={revealText[truth.id] || ""}
                onChange={(e) => setRevealText({ ...revealText, [truth.id]: e.target.value })}
                placeholder="Reveal your truth..."
                className="bg-white/5 border-white/10 text-white min-h-[80px] mb-2"
              />
              <Button size="sm" onClick={() => handleReveal(truth)} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full">
                Reveal Truth
              </Button>
            </div>
          )}
          {!isIncoming && truth.status === "revealed" && !truth.reward_paid && (
            <Button size="sm" onClick={() => handleProcessReward(truth)} className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">
              <Coins className="w-4 h-4 mr-1" /> Record Reward
            </Button>
          )}
          {isIncoming && truth.status === "revealed" && truth.reward_paid && (
            <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Reward recorded</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f0f0f] text-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
            <MessageCircleHeart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Truths</h1>
            <p className="text-gray-400 text-sm">Ask someone to share a truth. Stake Infinity Coin on their courage to reveal it.</p>
          </div>
        </div>

        <Tabs defaultValue="create">
          <TabsList className="bg-white/5 grid grid-cols-3 w-full">
            <TabsTrigger value="create" className="flex items-center gap-1.5"><Send className="w-4 h-4" /> Create</TabsTrigger>
            <TabsTrigger value="incoming" className="flex items-center gap-1.5"><Inbox className="w-4 h-4" /> Incoming</TabsTrigger>
            <TabsTrigger value="outgoing" className="flex items-center gap-1.5"><ArrowUpRight className="w-4 h-4" /> Outgoing</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><CardTitle className="text-white">Ask for a Truth</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Who do you want to ask? (email)</Label>
                    <Input type="email" value={form.responder_email} onChange={(e) => setForm({ ...form, responder_email: e.target.value })} placeholder="friend@example.com" className="mt-1 bg-white/5 border-white/10 text-white" required />
                  </div>
                  <div>
                    <Label className="text-gray-400">What truth do you want them to reveal?</Label>
                    <Textarea value={form.truth_prompt} onChange={(e) => setForm({ ...form, truth_prompt: e.target.value })} placeholder="What's a dream you've never told anyone?" className="mt-1 bg-white/5 border-white/10 text-white min-h-[100px]" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-400">Stake (Infinity)</Label>
                      <Input type="number" min="0" value={form.infinity_coin_stake} onChange={(e) => setForm({ ...form, infinity_coin_stake: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-gray-400">Days to respond</Label>
                      <Input type="number" min="1" max="30" value={form.expires_days} onChange={(e) => setForm({ ...form, expires_days: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <Button type="submit" disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full h-12">
                    {createMutation.isPending ? "Sending..." : "Send Truth 💬"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming" className="space-y-3">
            {incLoading ? <p className="text-gray-500 text-center py-8">Loading...</p> : incoming?.length === 0 ? (
              <Card className="bg-white/5 border-white/10"><CardContent className="pt-10 pb-10 text-center text-gray-500">No truths yet. When someone asks you, it'll show up here!</CardContent></Card>
            ) : incoming?.map((t) => <TruthCard key={t.id} truth={t} isIncoming />)}
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-3">
            {outLoading ? <p className="text-gray-500 text-center py-8">Loading...</p> : outgoing?.length === 0 ? (
              <Card className="bg-white/5 border-white/10"><CardContent className="pt-10 pb-10 text-center text-gray-500">You haven't asked any truths yet.</CardContent></Card>
            ) : outgoing?.map((t) => <TruthCard key={t.id} truth={t} isIncoming={false} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}