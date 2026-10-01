import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AgentChat({ agentName = "domain_ops_agent", title = "Strategic Insights" }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const convs = await base44.agents.listConversations({ agent_name: agentName });
        if (convs.length > 0) {
          setConversationId(convs[0].id);
          setMessages(convs[0].messages || []);
        } else {
          const conv = await base44.agents.createConversation({ agent_name: agentName, metadata: { name: title, description: title } });
          setConversationId(conv.id);
        }
      } catch (e) {
        console.error("Agent init error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages || []);
      setSending(false);
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const conv = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conv, { role: "user", content });
    } catch (e) {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-white/50 py-12">
            <Bot className="w-10 h-10 mx-auto mb-3 text-pink-500/60" />
            <p className="text-sm font-medium">Ask me to add a domain, run an analysis, or check your SEO performance.</p>
            <p className="text-xs mt-2 text-white/40">Try: "Add benearme.com" or "Analyze strategicmindsai.com"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === "user" ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white" : "bg-white/10 text-white border border-white/10"}`}>
              {msg.content && <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">{msg.content}</ReactMarkdown>}
              {msg.tool_calls?.map((tc, j) => (
                <div key={j} className="mt-2 text-xs text-white/50 border-l-2 border-pink-500/40 pl-2">
                  <span className="font-semibold">{tc.name}</span> — <span className={tc.status === "completed" || tc.status === "success" ? "text-green-400" : "text-yellow-400"}>{tc.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <div className="border-t border-white/10 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask about your domains..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-500/50"
        />
        <button onClick={handleSend} disabled={!input.trim() || sending} className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 flex items-center justify-center disabled:opacity-40 shadow-[0_0_16px_rgba(236,72,153,0.4)]">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}