import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image, BarChart2, Pin, X, Plus, Loader2 } from "lucide-react";
import { uploadFileProxy } from "@/lib/uploadHelper";

export default function PostComposer({ channel, user, onPosted }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const postMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadFileProxy(imageFile);
      }

      const payload = {
        channel_id: channel.id,
        channel_name: channel.name,
        channel_avatar: channel.avatar_url,
        type,
        content,
        visibility: "public",
      };

      if (type === "image" && imageUrl) payload.image_url = imageUrl;

      if (type === "poll") {
        payload.poll_options = pollOptions
          .filter(o => o.trim())
          .map((text, i) => ({ id: String(i), text, votes: 0 }));
        payload.poll_total_votes = 0;
        payload.poll_voted_by = [];
      }

      await base44.entities.CommunityPost.create(payload);
    },
    onSuccess: () => {
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setPollOptions(["", ""]);
      setType("text");
      queryClient.invalidateQueries(['communityPosts']);
      onPosted?.();
    },
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setType("image");
    }
  };

  const canPost = content.trim() || (type === "image" && imageFile) || (type === "poll" && pollOptions.filter(o => o.trim()).length >= 2);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={channel.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
            {channel.name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === "poll" ? "Ask your community a question..." : "Share something with your community..."}
            className="bg-transparent border-0 border-b border-white/10 rounded-none text-white placeholder:text-gray-500 resize-none focus-visible:ring-0 px-0"
            rows={2}
          />

          {/* Poll options */}
          {type === "poll" && (
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[i] = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="bg-white/5 border-white/10 text-white"
                    maxLength={80}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add option
                </Button>
              )}
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="max-h-48 rounded-xl object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setType("text"); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label htmlFor="community-image" className="cursor-pointer">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" asChild>
                  <span><Image className="w-5 h-5" /></span>
                </Button>
                <input id="community-image" type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setType(type === "poll" ? "text" : "poll")}
                className={type === "poll" ? "text-blue-400" : "text-gray-400 hover:text-white"}
              >
                <BarChart2 className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={() => postMutation.mutate()}
              disabled={!canPost || postMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 rounded-full px-6"
              size="sm"
            >
              {postMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}