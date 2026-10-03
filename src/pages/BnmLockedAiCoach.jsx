import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, Leaf, MapPin, Mic, PawPrint, Send, Sparkles, Users } from "lucide-react";
import { BnmLockedScreen, EmptyState, Glass, Pill, asItems } from "@/components/bnm/LockedShell";

function extractText(result) {
  return result?.data?.content || result?.data?.text || result?.content || result?.text || result?.data?.response || "I’m here to help you find a positive next step.";
}

export default function BnmLockedAiCoach() {
  const [messages, setMessages] = useState([{ role:"assistant", content:"Hey there! I’m your AI Coach. I can help you find nearby good-deed ideas, connect with local opportunities, and turn a positive idea into a safe action." }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const { data: posts = [] } = useQuery({
    queryKey:["bnm-ai-nearby-posts"],
    queryFn: async () => asItems(await base44.entities.CommunityPost.filter({ visibility:"public" }, "-created_date", 12)),
  });

  const send = async (suggestion) => {
    const content = String(suggestion ?? input).trim();
    if (!content || sending) return;
    setMessages((m)=>[...m,{role:"user",content}]);
    setInput("");
    setSending(true);
    try {
      const result = await base44.functions.invoke("aiChat", { prompt: "You are the Be Near Me AI Coach. Give safe, practical, positive, non-shaming suggestions. Never invent a live event or business. User: " + content });
      setMessages((m)=>[...m,{role:"assistant",content:extractText(result)}]);
    } catch {
      setMessages((m)=>[...m,{role:"assistant",content:"I couldn’t reach the coach service right now. Try again in a moment, or browse verified community activity below."}]);
    } finally {
      setSending(false);
    }
  };

  return (
    <BnmLockedScreen activeSection="For You">
      <div className="px-3 pt-3">
        <Glass className="overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffffff,#7667ff_25%,#251e73_65%,#080f2d)] shadow-[0_0_28px_rgba(107,90,255,.55)]"><Sparkles className="h-6 w-6 text-white"/></div><div><h1 className="text-[25px] font-black">AI Coach</h1><p className="text-[11px] text-[#9aadd0]">Your positive assistant for a kinder community.</p></div></div>
            <Pill><span className="h-2 w-2 rounded-full bg-emerald-400"/> Online</Pill>
          </div>

          <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:none]">
            {messages.map((m,i)=><div key={i} className={m.role==="user" ? "ml-auto max-w-[82%] rounded-[20px_20px_4px_20px] bg-gradient-to-r from-[#477dff] to-[#e43dca] px-4 py-3 text-[13px] leading-5" : "max-w-[88%] rounded-[20px_20px_20px_4px] border border-[#554e9d] bg-[#151c49] px-4 py-3 text-[13px] leading-5 text-[#eef3ff]"}>{m.content}</div>)}
            {sending ? <div className="w-fit rounded-full bg-[#151c49] px-4 py-2 text-xs text-[#b7c3de]">Coach is thinking…</div> : null}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none]"><Pill active><Sparkles className="h-3 w-3"/> Near Me</Pill><Pill><Leaf className="h-3 w-3"/> Environment</Pill><Pill><Users className="h-3 w-3"/> People</Pill><Pill><PawPrint className="h-3 w-3"/> Animals</Pill></div>
        </Glass>

        <section className="mt-3">
          <div className="mb-2 flex items-end justify-between"><div><h2 className="text-[22px] font-black"><MapPin className="mr-1 inline h-5 w-5 text-[#45bfff]"/>Try this near you</h2><p className="text-[10px] text-[#8fa2c2]">Only real public community activity is shown here.</p></div></div>
          {posts.length ? <div className="grid grid-cols-3 gap-2">{posts.slice(0,3).map((p)=><Glass key={p.id} className="overflow-hidden"><div className="aspect-square bg-gradient-to-br from-[#153c67] to-[#4c194f]">{p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><Heart className="h-8 w-8 text-[#ff4bb4]"/></div>}</div><div className="p-2"><div className="line-clamp-3 text-[10px] font-bold leading-4">{p.content || "Community activity"}</div></div></Glass>)}</div> : <EmptyState icon={MapPin} title="No public suggestions yet" body="The AI will not invent nearby opportunities." />}
        </section>

        <div className="mt-3 flex items-center gap-2 rounded-full border border-[#8c69c8] bg-[#0b1731] p-2 pl-4">
          <Sparkles className="h-5 w-5 text-[#b778ff]"/><input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") send();}} placeholder="Ask me anything…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#7f91b5]"/><Mic className="h-5 w-5 text-[#91a7ca]"/><button onClick={()=>send()} disabled={!input.trim()||sending} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-[#5e8fff] to-[#ff3bae] disabled:opacity-40"><Send className="h-5 w-5"/></button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none]">
          {["Something helpful near me","Something quick","Free opportunities","Group activities"].map((x)=><button key={x} onClick={()=>send(x)} className="whitespace-nowrap rounded-full border border-[#405982] bg-[#0b1932] px-3 py-2 text-[10px] font-bold text-[#c1cee5]">{x}</button>)}
        </div>
      </div>
    </BnmLockedScreen>
  );
}