import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, Star } from "lucide-react";

const VIEWER_FEATURES = [
  "No ads on any video",
  "Offline downloads",
  "Background audio playback",
  "Premium badge on profile",
  "Higher video quality (4K)",
  "Early access to new features",
  "Members-only community posts",
  "Exclusive dark & light themes",
];

const CREATOR_FEATURES = [
  "Everything in Viewer Premium",
  "Advanced analytics dashboard",
  "100 AI generation credits/month",
  "AI Clip Factory access",
  "AI title & description generator",
  "Priority video processing",
  "Custom channel themes",
  "Extended upload limits (up to 10GB)",
  "Detailed audience retention data",
  "A/B thumbnail testing",
];

export default function Premium() {
  const [billing, setBilling] = useState("monthly");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['mySubscription', user?.email],
    queryFn: () => base44.entities.PremiumSubscription.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const activeSub = subscription?.find(s => s.status === 'active');

  const viewerPrice = billing === 'monthly' ? 9.99 : 7.99;
  const creatorPrice = billing === 'monthly' ? 24.99 : 19.99;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-4">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Vidio Premium</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Upgrade your experience
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Ad-free viewing, AI tools, advanced analytics, and more.
          </p>

          {/* Active subscription badge */}
          {activeSub && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm capitalize">
                Active: {activeSub.plan.replace('_', ' ')} plan
              </span>
            </div>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${billing === 'yearly' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Yearly
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">Save 20%</Badge>
          </button>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Viewer Premium */}
          <Card className="bg-white/5 border-white/10 relative">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Viewer Premium</CardTitle>
                  <p className="text-gray-400 text-sm">The best way to watch</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-black text-white">€{viewerPrice}</span>
                <span className="text-gray-400 text-sm ml-1">/month</span>
                {billing === 'yearly' && (
                  <p className="text-green-400 text-xs mt-1">Billed €{(viewerPrice * 12).toFixed(2)}/year</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5">
                {VIEWER_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl mt-4"
                onClick={() => !user && base44.auth.redirectToLogin()}
              >
                {activeSub?.plan === 'viewer_premium' ? 'Current Plan' : 'Get Viewer Premium'}
              </Button>
            </CardContent>
          </Card>

          {/* Creator Pro */}
          <Card className="bg-gradient-to-b from-purple-500/10 to-pink-500/10 border-purple-500/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Creator Pro</CardTitle>
                  <p className="text-gray-400 text-sm">AI tools + advanced analytics</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-black text-white">€{creatorPrice}</span>
                <span className="text-gray-400 text-sm ml-1">/month</span>
                {billing === 'yearly' && (
                  <p className="text-green-400 text-xs mt-1">Billed €{(creatorPrice * 12).toFixed(2)}/year</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5">
                {CREATOR_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl mt-4"
                onClick={() => !user && base44.auth.redirectToLogin()}
              >
                {activeSub?.plan === 'creator_pro' ? 'Current Plan' : 'Get Creator Pro'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature comparison note */}
        <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-2">All plans include</h3>
          <p className="text-gray-400 text-sm">HD streaming · Mobile app · 24/7 support · Cancel anytime</p>
          <p className="text-gray-500 text-xs mt-2">Stripe payments coming soon. Join the waitlist by signing up.</p>
        </div>
      </div>
    </div>
  );
}