import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Radio, Users } from "lucide-react";
import { bnmData } from "@/services/bnmData";
import LivePlayer from "@/components/live/LivePlayer";
import LiveChat from "@/components/live/LiveChat";
import {
  Avatar,
  BnmLockedScreen,
  EmptyState,
  Glass,
  GradientButton,
  Pill,
  asItems,
  formatCount,
} from "@/components/bnm/LockedShell";

async function safeCurrentUser() {
  try {
    return await bnmData.auth.me();
  } catch {
    return null;
  }
}

export default function BnmLockedLiveWatch() {
  const [params] = useSearchParams();
  const streamId = params.get("id");
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["bnmLiveStream", streamId],
    queryFn: async () =>
      asItems(await bnmData.entities.LiveStream.filter({ id: streamId }, { limit: 1 })),
    enabled: Boolean(streamId),
    refetchInterval: 10000,
  });

  const currentStream = streams[0];

  const { data: channels = [] } = useQuery({
    queryKey: ["bnmLiveChannel", currentStream?.channel_id],
    queryFn: async () =>
      asItems(
        await bnmData.entities.Channel.filter(
          { id: currentStream.channel_id },
          { limit: 1 }
        )
      ),
    enabled: Boolean(currentStream?.channel_id),
  });

  const currentChannel = channels[0];

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["bnmLiveSubscription", currentChannel?.id, user?.email],
    queryFn: async () =>
      asItems(
        await bnmData.entities.Subscription.filter(
          { channel_id: currentChannel.id, created_by: user.email },
          { limit: 1 }
        )
      ),
    enabled: Boolean(currentChannel?.id && user?.email),
  });

  useEffect(() => {
    setIsSubscribed(Boolean(subscriptions[0]));
  }, [subscriptions]);

  useEffect(() => {
    if (!currentStream?.id) return;
    const current = Number(currentStream.viewers_current || 0);
    bnmData.entities.LiveStream.update(currentStream.id, {
      viewers_current: current + 1,
      total_views: Number(currentStream.total_views || 0) + 1,
    }).catch(() => {});

    return () => {
      bnmData.entities.LiveStream.update(currentStream.id, {
        viewers_current: Math.max(0, current),
      }).catch(() => {});
    };
  }, [currentStream?.id]);

  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email || !currentChannel?.id) return;
      if (subscriptions[0]) {
        await bnmData.entities.Subscription.delete(subscriptions[0].id);
        return;
      }
      await bnmData.entities.Subscription.create({
        channel_id: currentChannel.id,
        channel_name: currentChannel.name,
        channel_avatar: currentChannel.avatar_url,
      });
    },
    onSuccess: async () => {
      setIsSubscribed((value) => !value);
      await queryClient.invalidateQueries({
        queryKey: ["bnmLiveSubscription", currentChannel?.id, user?.email],
      });
    },
  });

  if (isLoading) {
    return (
      <BnmLockedScreen activeSection="Live">
        <div className="grid min-h-[60dvh] place-items-center px-4">
          <Radio className="h-10 w-10 animate-pulse text-[#ff4fb8]" />
        </div>
      </BnmLockedScreen>
    );
  }

  if (!currentStream) {
    return (
      <BnmLockedScreen activeSection="Live">
        <div className="px-3 pt-6">
          <EmptyState
            icon={Radio}
            title="Stream unavailable"
            body="This live stream may have ended or is no longer public."
          />
          <div className="mt-4 text-center">
            <Link to="/live" className="text-sm font-bold text-[#46bfff]">
              Browse live streams
            </Link>
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen activeSection="Live">
      <div className="px-2 pt-2">
        <Glass className="overflow-hidden p-1">
          <LivePlayer stream={currentStream} />
        </Glass>

        <Glass className="mt-2 p-3">
          <div className="flex items-center gap-2">
            <Pill active>
              <Radio className="h-3.5 w-3.5" />
              LIVE
            </Pill>
            <span className="flex items-center gap-1 text-[10px] text-[#91a2c5]">
              <Users className="h-3 w-3" />
              {formatCount(currentStream.viewers_current || 0)} watching
            </span>
          </div>

          <h1 className="mt-3 text-[18px] font-black leading-6 text-white">
            {currentStream.title || "Live stream"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Avatar
              src={currentChannel?.avatar_url || currentStream.channel_avatar}
              label={currentChannel?.name || currentStream.channel_name || "BNM"}
              size={42}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">
                {currentChannel?.name || currentStream.channel_name || "Creator"}
              </p>
              <p className="text-[10px] text-[#8fa0c4]">
                {formatCount(currentChannel?.subscribers_count || 0)} followers
              </p>
            </div>
            {user?.email && currentChannel?.created_by !== user.email ? (
              <GradientButton
                type="button"
                className="px-4 py-2 text-[11px]"
                disabled={subscriptionMutation.isPending}
                onClick={() => subscriptionMutation.mutate()}
              >
                {isSubscribed ? "Following" : "Follow"}
              </GradientButton>
            ) : null}
          </div>

          {currentStream.description ? (
            <p className="mt-3 text-[12px] leading-5 text-[#a8b5d1]">
              {currentStream.description}
            </p>
          ) : null}
        </Glass>

        <Glass className="mt-2 h-[420px] overflow-hidden">
          <LiveChat
            streamId={streamId}
            channelOwnerEmail={currentChannel?.created_by}
          />
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
