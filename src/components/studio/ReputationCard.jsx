import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, RefreshCw, Loader2, Star, TrendingUp, Shield, Zap } from "lucide-react";

const LEVELS = {
  bronze: { color: "text-amber-600", bg: "bg-amber-600/20", border: "border-amber-600/30", icon: "🥉" },
  silver: { color: "text-gray-300", bg: "bg-gray-400/20", border: "border-gray-400/30", icon: "🥈" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30", icon: "🥇" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-400/20", border: "border-cyan-400/30", icon: "💎" },
  verified: { color: "text-blue-400", bg: "bg-blue-400/20", border: "border-blue-400/30", icon: "✅" },
};

const scoreMetrics = [
  { key: "upload_consistency", label: "Upload Consistency", icon: TrendingUp, tip: "Upload regularly to improve" },
  { key: "watch_time_score", label: "Watch Time", icon: Zap, tip: "Grow total watch hours" },
  { key: "engagement_score", label: "Engagement", icon: Star, tip: "Likes + comments per view" },
  { key: "growth_score", label: "Subscriber Growth", icon: Trophy, tip: "Subscriber count matters" },
];

export default function ReputationCard({ channelId }) {
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { data: reputationData, refetch } = useQuery({
    queryKey: ['reputation', channelId],
    queryFn: () => base44.entities.CreatorReputation.filter({ channel_id: channelId }),
    enabled: !!channelId,
  });

  const reputation = reputationData?.[0];
  const level = LEVELS[reputation?.level || 'bronze'];

  const recalculate = async () => {
    setIsRecalculating(true);
    await base44.functions.invoke('calculateReputation', { channelId });
    await refetch();
    setIsRecalculating(false);
  };

  const score = reputation?.score || 0;

  return (
    <Card className={`border ${level.border} bg-white/5`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Creator Reputation
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={recalculate}
            disabled={isRecalculating}
            className="text-gray-400 hover:text-white"
          >
            {isRecalculating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score display */}
        <div className={`rounded-xl p-4 ${level.bg} border ${level.border} flex items-center justify-between`}>
          <div>
            <p className="text-gray-400 text-sm">Overall Score</p>
            <p className={`text-4xl font-black ${level.color}`}>{score}</p>
            <p className="text-gray-400 text-xs mt-1">out of 100</p>
          </div>
          <div className="text-right">
            <p className="text-4xl">{level.icon}</p>
            <Badge className={`${level.bg} ${level.color} border ${level.border} mt-1 capitalize`}>
              {reputation?.level || 'bronze'}
            </Badge>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-3">
          {scoreMetrics.map(({ key, label, icon: Icon, tip }) => {
            const val = reputation?.[key] || 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </div>
                  <span className="text-white text-sm font-semibold">{val}/100</span>
                </div>
                <Progress
                  value={val}
                  className="h-1.5"
                />
              </div>
            );
          })}
        </div>

        {/* Strikes */}
        {(reputation?.strikes || 0) > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="text-red-400 text-sm font-medium">⚠️ {reputation.strikes} strike{reputation.strikes > 1 ? 's' : ''} — each costs -20 pts</span>
          </div>
        )}

        {/* Perks */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className={`rounded-lg p-2 text-center text-xs ${reputation?.monetization_eligible ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-gray-500'}`}>
            💰 Monetization {reputation?.monetization_eligible ? 'Eligible' : 'Locked'}
          </div>
          <div className={`rounded-lg p-2 text-center text-xs ${reputation?.featured_eligible ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/5 text-gray-500'}`}>
            ⭐ Featured {reputation?.featured_eligible ? 'Eligible' : 'Locked'}
          </div>
        </div>

        {!reputation && (
          <Button onClick={recalculate} disabled={isRecalculating} className="w-full bg-purple-600 hover:bg-purple-700">
            {isRecalculating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Calculating...</> : 'Calculate My Score'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}