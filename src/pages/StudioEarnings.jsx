import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StudioSidebar from "@/components/studio/StudioSidebar";
import AnalyticsChart from "@/components/studio/AnalyticsChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Users,
  Gift
} from "lucide-react";

export default function StudioEarnings() {
  const [timeRange, setTimeRange] = useState("28");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: earnings } = useQuery({
    queryKey: ['myEarnings', channel?.[0]?.id],
    queryFn: () => base44.entities.CreatorEarning.filter(
      { channel_id: channel?.[0]?.id },
      "-created_date",
      100
    ),
    enabled: !!channel?.[0]?.id,
  });

  const { data: payouts } = useQuery({
    queryKey: ['myPayouts', channel?.[0]?.id],
    queryFn: () => base44.entities.Payout.filter(
      { channel_id: channel?.[0]?.id },
      "-created_date",
      10
    ),
    enabled: !!channel?.[0]?.id,
  });

  const myChannel = channel?.[0];

  // Calculate totals
  const totalEarnings = earnings?.reduce((sum, e) => sum + (e.amount_cents || 0), 0) || 0;
  const pendingEarnings = earnings?.filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (e.amount_cents || 0), 0) || 0;
  const availableBalance = myChannel?.earnings_balance || 0;
  
  // Generate chart data
  const days = parseInt(timeRange);
  const revenueData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      adRevenue: Math.floor(Math.random() * 100) + 20,
      memberships: Math.floor(Math.random() * 50) + 10,
      superchats: Math.floor(Math.random() * 30) + 5,
    };
  });

  // Revenue breakdown
  const revenueBreakdown = [
    { source: "Ad Revenue", amount: Math.floor(totalEarnings * 0.7), icon: Play, color: "from-red-500 to-orange-500" },
    { source: "Memberships", amount: Math.floor(totalEarnings * 0.2), icon: Users, color: "from-purple-500 to-pink-500" },
    { source: "Super Chats", amount: Math.floor(totalEarnings * 0.08), icon: Gift, color: "from-yellow-500 to-amber-500" },
    { source: "Premium", amount: Math.floor(totalEarnings * 0.02), icon: CreditCard, color: "from-blue-500 to-cyan-500" },
  ];

  const formatCurrency = (cents) => {
    return "$" + (cents / 100).toFixed(2);
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioEarnings" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Earnings</h1>
              <p className="text-gray-400">Track your revenue and payouts</p>
            </div>
            
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="bg-white/5">
                <TabsTrigger value="7">7 days</TabsTrigger>
                <TabsTrigger value="28">28 days</TabsTrigger>
                <TabsTrigger value="90">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Available Balance</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(availableBalance)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                  Request Payout
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending Earnings</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(pendingEarnings)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  Clears within 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Lifetime Earnings</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(myChannel?.total_earnings || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-green-400 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+12% this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <AnalyticsChart
                title="Revenue Over Time"
                data={revenueData}
                type="area"
                dataKeys={["adRevenue", "memberships", "superchats"]}
                colors={["#ef4444", "#a855f7", "#eab308"]}
                height={350}
              />
            </div>

            {/* Revenue Breakdown */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {revenueBreakdown.map((source) => (
                  <div key={source.source} className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${source.color} flex items-center justify-center`}>
                          <source.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white text-sm">{source.source}</span>
                      </div>
                      <span className="text-white font-semibold">{formatCurrency(source.amount)}</span>
                    </div>
                    <Progress 
                      value={totalEarnings > 0 ? (source.amount / totalEarnings) * 100 : 0} 
                      className="h-1.5"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Monetization Status & Payouts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monetization Status */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Monetization Status</CardTitle>
                <CardDescription>Your channel's monetization features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { feature: "Ad Revenue", enabled: myChannel?.monetization_enabled, requirement: "1,000 subscribers" },
                  { feature: "Channel Memberships", enabled: (myChannel?.subscribers_count || 0) >= 1000, requirement: "1,000 subscribers" },
                  { feature: "Super Chat", enabled: (myChannel?.subscribers_count || 0) >= 1000, requirement: "1,000 subscribers" },
                  { feature: "Merchandise Shelf", enabled: (myChannel?.subscribers_count || 0) >= 10000, requirement: "10,000 subscribers" },
                ].map((item) => (
                  <div key={item.feature} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      {item.enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{item.feature}</p>
                        <p className="text-gray-500 text-xs">{item.requirement}</p>
                      </div>
                    </div>
                    <Badge className={item.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                      {item.enabled ? "Active" : "Locked"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Payouts */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Payouts</CardTitle>
                <CardDescription>Your payout history</CardDescription>
              </CardHeader>
              <CardContent>
                {payouts?.length > 0 ? (
                  <div className="space-y-4">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {formatCurrency(payout.amount_cents)}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(payout.created_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusColors[payout.status] || statusColors.pending}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No payouts yet</p>
                    <p className="text-gray-500 text-sm">Minimum payout: $100</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}