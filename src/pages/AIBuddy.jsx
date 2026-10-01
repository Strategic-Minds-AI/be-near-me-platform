import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Send, Heart, Shield, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";

const AGENT_NAME = "ai_buddy";

const SUGGESTIONS = [
  "Give me a kindness dare idea",
  "I want to dare a friend — help me make it positive",
  "How do the strikes work?",
  "I'm nervous about a truth someone asked me",
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 text-white text-xs">
            You
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white rounded-tr-sm"
              : "bg-white/10 text-white rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none [&>*]:my-0 [&_p]:my-1">
              <ReactMarkdown>{message.content || ""}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIBuddy() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const scrollRef = useRef(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Load or create a conversation with the AI Buddy
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!user?.email) return;
      try {
        const conversations = base44.agents.listConversations({ agent_name: AGENT_NAME });
        const existing = conversations && conversations.length > 0 ? conversations[0] : null;
        const conv = existing || base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: "My AI Buddy", description: "Personal positivity companion" },
        });
        if (cancelled) return;
        setConversationId(conv.id);
        setMessages(conv.messages || []);
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoadingConv(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [user?.email]);

  // Subscribe to streaming updates
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || !conversationId || sending) return;
    setInput("");
    setSending(true);
    try {
      const conv = base44.agents.getConversation(conversationId);
      base44.agents.addMessage(conv, { role: "user", content });
    } catch (e) {
      setSending(false);
    }
  };

  if (userLoading || loadingConv) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f] text-white p-6">
        <div className="text-center max-w-sm">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-pink-500" />
          <h2 className="text-xl font-semibold mb-2">Meet your AI Buddy</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Your personal positivity companion — here to inspire kindness dares, guide good choices, and cheer you on. Sign in to start chatting.
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 rounded-full px-6"
          >
            Sign In to Meet Buddy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f0f0f] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white">
                <Sparkles className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0f0f0f]" />
          </div>
          <div>
            <h1 className="font-semibold text-lg flex items-center gap-2">
              Buddy
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            </h1>
            <p className="text-xs text-gray-400">Your positivity companion · always here for you</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 mb-4">
                <Sparkles className="w-8 h-8 text-pink-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Hey! I'm your Buddy 👋</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                I'm here to inspire you to spread kindness, dare your friends to do good, and make choices you're proud of. What's on your mind?
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-sm px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {sending && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-4 bg-[#0f0f0f]">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message your Buddy..."
            className="flex-1 h-11 bg-white/5 border-white/10 rounded-full text-white placeholder:text-gray-500 focus:bg-white/10"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="h-11 w-11 rounded-full p-0 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-w-2xl mx-auto mt-2 flex items-center justify-center gap-4 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Positivity only</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Zero shame</span>
          <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Earn Infinity Coin</span>
        </div>
      </div>
    </div>
  );
}