import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ChevronLeft, Gift, Leaf, LockKeyhole, MapPin, ShieldCheck, Truck } from "lucide-react";
import { BnmLockedScreen, Glass, GradientButton, Pill, asItems, formatCount } from "@/components/bnm/LockedShell";
import { getReward } from "@/lib/bnm/rewardCatalog";

export default function BnmLockedCheckout() {
  const { rewardId } = useParams();
  const reward = getReward(rewardId);
  const [delivery, setDelivery] = useState("ship");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const { data:user } = useQuery({queryKey:["currentUser"],queryFn:()=>base44.auth.me()});
  const { data:channels=[] } = useQuery({
    queryKey:["bnm-checkout-channel",user?.email],
    enabled:!!user?.email,
    queryFn:async()=>asItems(await base44.entities.Channel.filter({created_by:user.email},"-created_date",1)),
  });
  const channel=channels[0];
  const points=Number(channel?.credits||0);
  const enough=points>=reward.points;

  const claim=async()=>{
    if(!channel||!enough||reward.requires_verified_partner||status==="loading") return;
    setStatus("loading");setMessage("");
    try{
      const key="reward:"+reward.id+":"+user.email+":"+Date.now();
      const result=await base44.functions.invoke("redeemReward",{reward_id:reward.id,delivery_method:delivery,idempotency_key:key});
      if(result?.data?.success===false) throw new Error(result.data.error||"Redemption failed");
      setStatus("success");setMessage("Reward claim recorded. Fulfillment will use only verified delivery information.");
    }catch(error){
      setStatus("error");setMessage(error?.message||"Reward claim could not be recorded.");
    }
  };

  return (
    <BnmLockedScreen rewards>
      <div className="px-3 pt-3">
        <div className="flex items-center gap-3"><Link to="/rewards" className="grid h-10 w-10 place-items-center rounded-full border border-[#30496f] bg-[#0b1830]"><ChevronLeft className="h-5 w-5"/></Link><div><h1 className="text-[26px] font-black">Checkout</h1><p className="text-sm text-[#9eadd0]">Claim Your Reward</p></div></div>

        <Glass className="mt-4 p-3">
          <div className="flex gap-3"><div className="grid h-[150px] w-[150px] shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-[#23456c] to-[#3a1748]"><Gift className="h-14 w-14 text-[#ff55b8]"/></div><div className="min-w-0 flex-1 py-2"><Pill><Leaf className="h-3 w-3"/>Kindness Reward</Pill><h2 className="mt-2 text-[20px] font-black leading-6">{reward.name}</h2><p className="mt-1 text-xs text-[#98a9c8]">{reward.description}</p><div className="mt-4 text-[22px] font-black text-[#e153ff]">♥ {formatCount(reward.points)} points</div></div></div>
        </Glass>

        <h2 className="mt-5 text-[20px] font-black">Delivery Option</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={()=>setDelivery("ship")} className={"rounded-[18px] border p-3 text-left "+(delivery==="ship"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}><Truck className="h-7 w-7"/><b className="mt-2 block text-sm">Ship to Me</b><span className="text-[9px] text-[#91a2c2]">Uses verified address at fulfillment</span></button>
          <button onClick={()=>setDelivery("pickup")} className={"rounded-[18px] border p-3 text-left "+(delivery==="pickup"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}><MapPin className="h-7 w-7"/><b className="mt-2 block text-sm">Pick Up Nearby</b><span className="text-[9px] text-[#91a2c2]">Only when a verified pickup location exists</span></button>
        </div>

        <Glass className="mt-4 p-4">
          <h2 className="text-[18px] font-black">Order Summary</h2>
          <div className="mt-3 flex items-center justify-between border-b border-[#243a5f] pb-3"><span>{reward.name}</span><b>{formatCount(reward.points)} pts</b></div>
          <div className="mt-3 flex items-center justify-between"><b>Total</b><b className="text-[#ff4fb3]">♥ {formatCount(reward.points)} points</b></div>
        </Glass>

        <Glass className="mt-4 p-4">
          <h2 className="text-[18px] font-black">Payment Method</h2>
          <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-[#d34dd5] bg-[#141f43] p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-[#ff47b8] to-[#6d6cff]">♥</span><div className="min-w-0 flex-1"><b className="block text-sm">Redeem with Kindness Points</b><span className="text-[10px] text-[#93a5c5]">{channel ? "Available balance: "+formatCount(points) : "Sign in and create a channel first"}</span></div><b>{formatCount(reward.points)} pts</b></div>
        </Glass>

        {reward.requires_verified_partner ? <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-amber-400/30 bg-amber-400/10 p-3 text-[11px] text-amber-100"><LockKeyhole className="h-5 w-5"/>This reward is locked until its partner is verified.</div> : null}
        {message ? <div className={"mt-3 rounded-[14px] border p-3 text-[11px] "+(status==="success"?"border-emerald-400/30 bg-emerald-400/10 text-emerald-100":"border-red-400/30 bg-red-400/10 text-red-100")}>{status==="success"?<CheckCircle2 className="mr-2 inline h-4 w-4"/>:null}{message}</div> : null}

        <GradientButton onClick={claim} disabled={!channel||!enough||reward.requires_verified_partner||status==="loading"||status==="success"} className="mt-4 w-full text-[17px]">{status==="loading"?"Recording claim…":status==="success"?"Claim Recorded":"Claim Reward"}</GradientButton>

        <div className="mt-4 grid grid-cols-3 gap-2 pb-4 text-center text-[9px] text-[#8497b8]"><div><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-[#4de7c0]"/>Secure & Private</div><div><Leaf className="mx-auto mb-1 h-5 w-5 text-[#61e7a4]"/>Purpose Driven</div><div><LockKeyhole className="mx-auto mb-1 h-5 w-5 text-[#58d9c6]"/>Verified Fulfillment</div></div>
      </div>
    </BnmLockedScreen>
  );
}