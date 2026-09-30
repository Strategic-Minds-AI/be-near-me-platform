import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Share2, BarChart2, Megaphone, Image, AlignLeft } from "lucide-react";

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

const typeIcons = { poll: BarChart2, image: Image, announcement: Megaphone, text: AlignLeft };
const typeColors = { announcement: "bg-yellow-500/20 text-yellow-400", poll: "bg-blue-500/20 text-blue-400" };

export default function PostCard({ post, user }) {
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState(null);
  const hasVoted = post.poll_voted_by?.includes(user?.email);

  const voteMutation = useMutation({
    mutationFn: async (optionId) => {
      const updated = (post.poll_options || []).map(opt =>
        opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      );
      const votedBy = [...(post.poll_voted_by || []), user.email];
      await base44.entities.CommunityPost.update(post.id, {
        poll_options: updated,
        poll_total_votes: (post.poll_total_votes || 0) + 1,
        poll_voted_by: votedBy,
      });
      setSelectedOption(optionId);
    },
    onSuccess: () => queryClient.invalidateQueries(['communityPosts']),
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CommunityPost.update(post.id, {
        likes: (post.likes || 0) + 1,
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['communityPosts']),
  });

  const TypeIcon = typeIcons[post.type] || AlignLeft;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.channel_avatar} />
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
              {post.channel_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{post.channel_name}</p>
            <p className="text-gray-500 text-sm">{timeAgo(post.created_date)}</p>
          </div>
        </div>
        {(post.type === "announcement" || post.type === "poll") && (
          <Badge className={typeColors[post.type] || "bg-white/10 text-gray-400"}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </Badge>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full max-h-96 object-cover rounded-xl"
        />
      )}

      {/* Poll */}
      {post.type === "poll" && post.poll_options?.length > 0 && (
        <div className="space-y-2">
          {post.poll_options.map((option) => {
            const percent = post.poll_total_votes > 0
              ? Math.round((option.votes / post.poll_total_votes) * 100)
              : 0;
            const isSelected = selectedOption === option.id || (hasVoted && option.votes > 0 && !selectedOption);
            const showResults = hasVoted || selectedOption;

            return (
              <button
                key={option.id}
                onClick={() => !hasVoted && !selectedOption && user && voteMutation.mutate(option.id)}
                disabled={!!(hasVoted || selectedOption || !user)}
                className={`w-full text-left rounded-xl border transition-all relative overflow-hidden ${
                  showResults
                    ? "border-white/10 bg-white/5 cursor-default"
                    : "border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer"
                }`}
              >
                {showResults && (
                  <div
                    className="absolute inset-0 bg-blue-500/20 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-3">
                  <span className="text-white text-sm">{option.text}</span>
                  {showResults && (
                    <span className="text-gray-300 text-sm font-semibold">{percent}%</span>
                  )}
                </div>
              </button>
            );
          })}
          <p className="text-gray-500 text-xs pl-1">{post.poll_total_votes || 0} votes</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => user && likeMutation.mutate()}
          className="text-gray-400 hover:text-white gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{post.likes || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}