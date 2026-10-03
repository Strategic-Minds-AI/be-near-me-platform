import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { bnmData } from "@/services/bnmData";
import VideoPlayer from "@/components/video/VideoPlayer";
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

export default function BnmLockedWatch() {
  const [params] = useSearchParams();
  const videoId = params.get("v");
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["bnm-watch-video", videoId],
    queryFn: async () =>
      asItems(await bnmData.entities.Video.filter({ id: videoId }, { limit: 1 })),
    enabled: Boolean(videoId),
  });

  const video = videos[0];

  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-watch-channel", video?.channel_id, video?.created_by],
    queryFn: async () => {
      if (video?.channel_id) {
        return asItems(
          await bnmData.entities.Channel.filter({ id: video.channel_id }, { limit: 1 })
        );
      }
      if (video?.created_by) {
        return asItems(
          await bnmData.entities.Channel.filter(
            { created_by: video.created_by },
            { limit: 1 }
          )
        );
      }
      return [];
    },
    enabled: Boolean(video?.channel_id || video?.created_by),
  });

  const channel = channels[0];

  const { data: comments = [] } = useQuery({
    queryKey: ["bnm-watch-comments", videoId],
    queryFn: async () =>
      asItems(
        await bnmData.entities.Comment.filter(
          { video_id: videoId },
          { sort: "-created_date", limit: 50 }
        )
      ),
    enabled: Boolean(videoId),
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ["bnm-watch-reaction", videoId, user?.email],
    queryFn: async () =>
      asItems(
        await bnmData.entities.Reaction.filter(
          {
            target_id: videoId,
            target_type: "video",
            created_by: user.email,
          },
          { limit: 1 }
        )
      ),
    enabled: Boolean(videoId && user?.email),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["bnm-watch-subscription", channel?.id, user?.email],
    queryFn: async () =>
      asItems(
        await bnmData.entities.Subscription.filter(
          { channel_id: channel.id, created_by: user.email },
          { limit: 1 }
        )
      ),
    enabled: Boolean(channel?.id && user?.email),
  });

  const reaction = reactions[0];
  const subscribed = Boolean(subscriptions[0]);

  useEffect(() => {
    if (!video?.id) return;
    bnmData.entities.Video.update(video.id, {
      views: Number(video.views || 0) + 1,
    }).catch(() => {});
  }, [video?.id]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email || !video?.id) return;
      if (reaction?.reaction === "like") {
        await bnmData.entities.Reaction.delete(reaction.id);
        await bnmData.entities.Video.update(video.id, {
          likes: Math.max(0, Number(video.likes || 1) - 1),
        });
        return;
      }
      if (reaction) {
        await bnmData.entities.Reaction.update(reaction.id, { reaction: "like" });
      } else {
        await bnmData.entities.Reaction.create({
          target_type: "video",
          target_id: video.id,
          reaction: "like",
        });
      }
      await bnmData.entities.Video.update(video.id, {
        likes: Number(video.likes || 0) + 1,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bnm-watch-video", videoId] });
      await queryClient.invalidateQueries({
        queryKey: ["bnm-watch-reaction", videoId, user?.email],
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email || !channel?.id) return;
      if (subscriptions[0]) {
        await bnmData.entities.Subscription.delete(subscriptions[0].id);
        return;
      }
      await bnmData.entities.Subscription.create({
        channel_id: channel.id,
        channel_name: channel.name,
        channel_avatar: channel.avatar_url,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["bnm-watch-subscription", channel?.id, user?.email],
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const text = commentText.trim();
      if (!text || !video?.id || !user?.email) return;
      await bnmData.entities.Comment.create({
        video_id: video.id,
        text,
        author_name: user.full_name || "Be Near Me member",
        author_avatar: "",
      });
      await bnmData.entities.Video.update(video.id, {
        comments_count: Number(video.comments_count || 0) + 1,
      });
    },
    onSuccess: async () => {
      setCommentText("");
      await queryClient.invalidateQueries({ queryKey: ["bnm-watch-comments", videoId] });
      await queryClient.invalidateQueries({ queryKey: ["bnm-watch-video", videoId] });
    },
  });

  const creatorHref = useMemo(
    () => (channel?.id ? "/profile?channel=" + encodeURIComponent(channel.id) : "/profile"),
    [channel?.id]
  );

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: video?.title || "Be Near Me", url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
  };

  if (isLoading) {
    return (
      <BnmLockedScreen>
        <div className="px-3 pt-4">
          <div className="aspect-[9/16] animate-pulse rounded-[22px] bg-[#08162b]" />
        </div>
      </BnmLockedScreen>
    );
  }

  if (!video) {
    return (
      <BnmLockedScreen>
        <div className="px-3 pt-6">
          <EmptyState
            title="Video unavailable"
            body="This video may have been removed, made private, or is no longer available."
          />
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen>
      <div className="px-2 pt-2">
        <Glass className="overflow-hidden p-1">
          <VideoPlayer video={video} />
        </Glass>

        <Glass className="mt-2 p-3">
          <h1 className="text-[17px] font-black leading-6 text-white">
            {video.title || "Untitled video"}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Link to={creatorHref}>
              <Avatar
                src={channel?.avatar_url || video.channel_avatar}
                label={channel?.name || video.channel_name || "BNM"}
                size={42}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={creatorHref} className="block truncate text-sm font-black text-white">
                {channel?.name || video.channel_name || "Creator"}
              </Link>
              <p className="text-[10px] text-[#8fa0c4]">
                {formatCount(video.views || 0)} views
              </p>
            </div>
            {user?.email && channel?.created_by !== user.email ? (
              <GradientButton
                type="button"
                className="px-4 py-2 text-[11px]"
                disabled={followMutation.isPending}
                onClick={() => followMutation.mutate()}
              >
                {subscribed ? "Following" : "Follow"}
              </GradientButton>
            ) : null}
          </div>

          {video.description ? (
            <p className="mt-3 text-[12px] leading-5 text-[#b2bfd8]">
              {video.description}
            </p>
          ) : null}

          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            <button type="button" onClick={() => likeMutation.mutate()}>
              <Pill active={reaction?.reaction === "like"}>
                <Heart className="h-3.5 w-3.5" />
                {formatCount(video.likes || 0)}
              </Pill>
            </button>
            <Pill>
              <MessageCircle className="h-3.5 w-3.5" />
              {formatCount(video.comments_count || comments.length)}
            </Pill>
            <button type="button" onClick={share}>
              <Pill>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Pill>
            </button>
          </div>
        </Glass>

        <Glass className="mt-2 p-3">
          <h2 className="text-sm font-black text-white">Comments</h2>

          {user?.email ? (
            <div className="mt-3 flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value.slice(0, 500))}
                placeholder="Add a positive comment…"
                className="min-w-0 flex-1 rounded-full border border-[#35517c] bg-[#0a1832] px-4 py-2.5 text-[12px] text-white outline-none placeholder:text-[#7184a8]"
              />
              <button
                type="button"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#26c8ff] via-[#8553ff] to-[#ff38aa] disabled:opacity-40"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-[#8799bd]">
              Sign in to join the conversation.
            </p>
          )}

          <div className="mt-3 space-y-3">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 border-t border-[#20375b] pt-3">
                  <Avatar
                    src={comment.author_avatar}
                    label={comment.author_name || "BN"}
                    size={32}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white">
                      {comment.author_name || "Be Near Me member"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-4 text-[#a7b5d1]">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-[11px] text-[#7f91b4]">
                No comments yet.
              </p>
            )}
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
