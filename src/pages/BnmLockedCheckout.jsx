import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Check, CheckCircle2, ChevronLeft, Gift, Leaf, LockKeyhole, MapPin, ShieldCheck, Truck
} from "lucide-react";
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
    queryKey:["bnm-checkout-channel-v2",user?.email],
    enabled:!!user?.email,
    queryFn:async()=>asItems(await base44.entities.Channel.filter({created_by:user.email},"-created_date",1)),
  });

  const channel=channels[0] || null;
  const points=Number(channel?.credits||0);
  const enough=points>=reward.points;
  const available=Boolean(reward.redeemable) && !reward.requires_verified_partner;

  const claim=async()=>{
    if(!channel||!enough||!available||status==="loading") return;
    setStatus("loading");
    setMessage("");
    try{
      const key="reward:"+reward.id+":"+user.email+":"+Date.now();
      const result=await base44.functions.invoke("redeemReward",{reward_id:reward.id,delivery_method:delivery,idempotency_key:key});
      const data=result?.data || result;
      if(data?.success===false) throw new Error(data.error||"Redemption failed");
      setStatus("success");
      setMessage("Reward claim recorded. Fulfillment will use only verified delivery information.");
    }catch(error){
      setStatus("error");
      setMessage(error?.message||"Reward claim could not be recorded.");
    }
  };

  return (
    <BnmLockedScreen activeSection="For You">
      <div className="px-3 pt-3">
        <div className="flex items-center gap-3">
          <Link to="/rewards" className="grid h-9 w-9 place-items-center rounded-full border border-[#30496f] bg-[#0b1830]"><ChevronLeft className="h-4.5 w-4.5"/></Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[23px] font-black leading-none">Checkout</h1>
            <p className="mt-1 text-[10px] text-[#9eadd0]">Claim Your Reward</p>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-black text-[#8596b5]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2f7cff] text-white"><Check className="h-3 w-3"/></span><span>Select</span>
            <span className="h-px w-3 bg-[#445b81]"/>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#8057ff] text-white">2</span><span>Details</span>
            <span className="h-px w-3 bg-[#445b81]"/>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff43ad] text-white">3</span>
          </div>
        </div>

        <Glass className="mt-3 p-3">
          <div className="flex gap-3">
            <div className="relative grid h-[128px] w-[132px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_70%_20%,rgba(255,68,177,.3),transparent_32%),linear-gradient(135deg,#23456c,#3a1748)]">
              {reward.visual === "leaf" ? <Leaf className="h-12 w-12 text-[#63e7ad]"/> : <Gift className="h-12 w-12 text-[#ff55b8]"/>}
              <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-1 text-[7px] font-black">BE NEAR ME</span>
            </div>
            <div className="min-w-0 flex-1 py-1">
              <Pill>{reward.internal ? "Kindness Reward" : "Partner Reward"}</Pill>
              <h2 className="mt-2 text-[17px] font-black leading-5">{reward.name}</h2>
              <p className="mt-1 text-[9px] leading-4 text-[#98a9c8]">{reward.description}</p>
              <div className="mt-2 text-[18px] font-black text-[#e153ff]">♥ {formatCount(reward.points)} points</div>
              <div className="mt-1 text-[8px] font-bold text-[#95a6c5]">{available ? "Verified fulfillment available" : "Coming soon — fulfillment not verified"}</div>
            </div>
          </div>
        </Glass>

        <h2 className="mt-4 text-[17px] font-black">Delivery Option</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={()=>setDelivery("ship")} className={"rounded-[17px] border p-3 text-left "+(delivery==="ship"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}>
            <Truck className="h-6 w-6"/>
            <b className="mt-2 block text-[11px]">Ship to Me</b>
            <span className="text-[8px] leading-3 text-[#91a2c2]">Requires verified fulfillment and shipping address</span>
          </button>
          <button onClick={()=>setDelivery("pickup")} className={"rounded-[17px] border p-3 text-left "+(delivery==="pickup"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}>
            <MapPin className="h-6 w-6"/>
            <b className="mt-2 block text-[11px]">Pick Up Nearby</b>
            <span className="text-[8px] leading-3 text-[#91a2c2]">Only when a verified pickup partner exists</span>
          </button>
        </div>

        <Glass className="mt-3 p-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[9px] font-black uppercase tracking-[.08em] text-[#8ea2c4]">Delivery details</div><div className="mt-1 text-[12px] font-black">{delivery === "ship" ? "No verified shipping address stored" : "No verified pickup location configured"}</div></div>
            <Link to="/Settings" className="text-[9px] font-black text-[#59caff]">Add / Edit</Link>
          </div>
          <p className="mt-2 text-[8px] leading-4 text-[#7f92b5]">The app will never invent an address, delivery estimate, store, or pickup partner.</p>
        </Glass>

        <Glass className="mt-3 p-4">
          <h2 className="text-[16px] font-black">Order Summary</h2>
          <div className="mt-3 flex items-center justify-between border-b border-[#243a5f] pb-3 text-[10px]"><span>{reward.name}</span><b>{formatCount(reward.points)} pts</b></div>
          <div className="mt-2 flex items-center justify-between text-[10px]"><span>Delivery</span><b>{available ? "Calculated at verified fulfillment" : "Unavailable"}</b></div>
          <div className="mt-3 flex items-center justify-between"><b className="text-[12px]">Total</b><b className="text-[14px] text-[#ff4fb3]">♥ {formatCount(reward.points)} points</b></div>
        </Glass>

        <Glass className="mt-3 p-4">
          <h2 className="text-[16px] font-black">Payment Method</h2>
          <div className="mt-3 flex items-center gap-3 rounded-[15px] border border-[#d34dd5] bg-[#141f43] p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-[#ff47b8] to-[#6d6cff]">♥</span>
            <div className="min-w-0 flex-1"><b className="block text-[11px]">Redeem with Kindness Points</b><span className="text-[8px] text-[#93a5c5]">{channel ? "Available balance: "+formatCount(points) : "Sign in and create a channel first"}</span></div>
            <b className="text-[10px]">{formatCount(reward.points)} pts</b>
          </div>
        </Glass>

        {!available ? <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-amber-400/30 bg-amber-400/10 p-3 text-[9px] leading-4 text-amber-100"><LockKeyhole className="h-5 w-5 shrink-0"/>This reward is visible for design parity but cannot be claimed until inventory/partner fulfillment is verified.</div> : null}
        {!enough && channel ? <div className="mt-2 rounded-[14px] border border-[#394f78] bg-[#0a1830] p-3 text-[9px] text-[#9fb0cf]">You need {formatCount(Math.max(0,reward.points-points))} more points for this reward.</div> : null}

        {message ? <div className={"mt-3 rounded-[14px] border p-3 text-[9px] "+(status==="success"?"border-emerald-400/30 bg-emerald-400/10 text-emerald-100":"border-red-400/30 bg-red-400/10 text-red-100")}>{status==="success"?<CheckCircle2 className="mr-2 inline h-4 w-4"/>:null}{message}</div> : null}

        <GradientButton
          onClick={claim}
          disabled={!channel||!enough||!available||status==="loading"||status==="success"}
          className="mt-3 w-full py-3.5 text-[14px]"
        >
          {status==="loading"?"Recording claim…":status==="success"?"Claim Recorded":available?"Claim Reward":"Reward Coming Soon"}
        </GradientButton>

        <div className="mt-3 grid grid-cols-3 gap-2 pb-4 text-center text-[8px] leading-3 text-[#8497b8]">
          <div><ShieldCheck className="mx-auto mb-1 h-4.5 w-4.5 text-[#4de7c0]"/>Secure & Private</div>
          <div><Leaf className="mx-auto mb-1 h-4.5 w-4.5 text-[#61e7a4]"/>Purpose Driven</div>
          <div><LockKeyhole className="mx-auto mb-1 h-4.5 w-4.5 text-[#58d9c6]"/>Verified Fulfillment</div>
        </div>
      </div>
    </BnmLockedScreen>
  );
}
