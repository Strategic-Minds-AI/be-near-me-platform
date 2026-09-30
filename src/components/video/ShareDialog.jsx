import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Linkedin,
  Mail,
  MessageCircle
} from "lucide-react";

export default function ShareDialog({ open, onOpenChange, video }) {
  const [copied, setCopied] = useState(false);
  
  const videoUrl = `${window.location.origin}/Watch?v=${video?.id}`;
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-[#1DA1F2]",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video?.title || "")}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#4267B2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0A66C2]",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(`${video?.title || ""} ${videoUrl}`)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600",
      url: `mailto:?subject=${encodeURIComponent(video?.title || "Check out this video")}&body=${encodeURIComponent(videoUrl)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#212121] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Share</DialogTitle>
        </DialogHeader>

        {/* Video Preview */}
        <div className="flex gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-24 aspect-video rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
            {video?.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium line-clamp-2">{video?.title}</p>
            <p className="text-gray-500 text-xs mt-1">{video?.channel_name}</p>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="flex justify-center gap-3">
          {shareOptions.map((option) => (
            <a
              key={option.name}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center hover:opacity-80 transition-opacity`}
              title={option.name}
            >
              <option.icon className="w-5 h-5 text-white" />
            </a>
          ))}
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <Input
            value={videoUrl}
            readOnly
            className="bg-white/5 border-white/10 text-white text-sm"
          />
          <Button
            onClick={copyToClipboard}
            className={`px-4 ${copied ? "bg-green-600 hover:bg-green-700" : "bg-white/10 hover:bg-white/20"}`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}