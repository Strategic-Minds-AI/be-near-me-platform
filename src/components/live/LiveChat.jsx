import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Send, 
  MoreVertical, 
  Users, 
  Settings,
  DollarSign,
  Crown,
  Shield,
  Flag
} from "lucide-react";

export default function LiveChat({ streamId, channelOwnerEmail }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['liveChatMessages', streamId],
    queryFn: () => base44.entities.LiveChatMessage.filter(
      { stream_id: streamId, deleted: false },
      "created_date",
      100
    ),
    enabled: !!streamId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LiveChatMessage.create({
        stream_id: streamId,
        message,
        sender_name: user?.full_name || "Anonymous",
        sender_avatar: "",
        is_owner: user?.email === channelOwnerEmail,
        is_moderator: false,
        is_member: false,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries(['liveChatMessages', streamId]);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate();
    }
  };

  const getBadge = (msg) => {
    if (msg.is_owner) {
      return <Badge className="bg-red-600 text-white text-xs px-1">Owner</Badge>;
    }
    if (msg.is_moderator) {
      return <Badge className="bg-blue-600 text-white text-xs px-1"><Shield className="w-3 h-3" /></Badge>;
    }
    if (msg.is_member) {
      return <Badge className="bg-green-600 text-white text-xs px-1"><Crown className="w-3 h-3" /></Badge>;
    }
    return null;
  };

  const getMessageStyle = (msg) => {
    if (msg.is_superchat) {
      const colors = {
        blue: "bg-blue-500/20 border-blue-500",
        cyan: "bg-cyan-500/20 border-cyan-500",
        green: "bg-green-500/20 border-green-500",
        yellow: "bg-yellow-500/20 border-yellow-500",
        orange: "bg-orange-500/20 border-orange-500",
        magenta: "bg-pink-500/20 border-pink-500",
        red: "bg-red-500/20 border-red-500",
      };
      return colors[msg.superchat_tier] || colors.blue;
    }
    return "";
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] border border-white/10 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium">Live Chat</h3>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {messages?.length || 0}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#212121] border-white/10">
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Chat settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollRef}
        className="flex-1 p-3"
        onScroll={handleScroll}
      >
        <div className="space-y-3">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 p-2 rounded-lg ${getMessageStyle(msg)}`}
            >
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={msg.sender_avatar} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                  {msg.sender_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  {getBadge(msg)}
                  <span className={`text-sm font-medium ${
                    msg.is_owner ? "text-red-400" : 
                    msg.is_moderator ? "text-blue-400" : 
                    msg.is_member ? "text-green-400" : "text-gray-300"
                  }`}>
                    {msg.sender_name}
                  </span>
                  {msg.is_superchat && (
                    <span className="text-yellow-400 text-xs font-bold">
                      ${(msg.superchat_amount / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-white text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))}

          {messages?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No messages yet</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to say hello!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages?.length > 0 && (
        <Button
          size="sm"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              setIsAtBottom(true);
            }
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 rounded-full text-xs"
        >
          New messages ↓
        </Button>
      )}

      {/* Input */}
      {user ? (
        <form onSubmit={handleSend} className="p-3 border-t border-white/10">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-yellow-400 hover:bg-yellow-400/10 flex-shrink-0"
              title="Send Super Chat"
            >
              <DollarSign className="w-5 h-5" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              className="bg-white/5 border-white/10 text-white"
              maxLength={200}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-3 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            Sign in to chat
          </p>
        </div>
      )}
    </div>
  );
}