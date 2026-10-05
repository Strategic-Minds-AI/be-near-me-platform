import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BnmCheckIcon, BnmCheckCircleIcon, BnmChevronLeftIcon, BnmGiftIcon, BnmLeafSmallIcon, BnmLockIcon, BnmMapPinIcon, BnmShieldIcon, BnmTruckIcon
} from "@/components/bnm/BnmIcons";
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
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2.5">
          <Link to="/rewards" className="grid h-8 w-8 place-items-center rounded-full border border-[#30496f] bg-[#0b1830]"><BnmChevronLeftIcon size={16} /></Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-black leading-none">Checkout</h1>
            <p className="mt-0.5 text-[9px] text-[#9eadd0]">Claim Your Reward</p>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-black text-[#8596b5]">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2f7cff] text-white"><BnmCheckIcon size={12} /></span><span>Select</span>
            <span className="h-px w-3 bg-[#445b81]"/>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#8057ff] text-white">2</span><span>Details</span>
            <span className="h-px w-3 bg-[#445b81]"/>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff43ad] text-white">3</span>
          </div>
        </div>

        <Glass className="mt-1.5 p-2">
          <div className="flex gap-3">
            <div className="relative grid h-[92px] w-[100px] shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_70%_20%,rgba(255,68,177,.3),transparent_32%),linear-gradient(135deg,#23456c,#3a1748)]">
              {reward.visual === "leaf" ? <BnmLeafSmallIcon size={40} /> : <BnmGiftIcon size={40} />}
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[6px] font-black">BE NEAR ME</span>
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <Pill>{reward.internal ? "Kindness Reward" : "Partner Reward"}</Pill>
              <h2 className="mt-1.5 text-[15px] font-black leading-4">{reward.name}</h2>
              <p className="mt-1 text-[8px] leading-3 text-[#98a9c8]">{reward.description}</p>
              <div className="mt-1.5 text-[16px] font-black text-[#e153ff]">♥ {formatCount(reward.points)} points</div>
              <div className="mt-0.5 text-[7px] font-bold text-[#95a6c5]">{available ? "Verified fulfillment available" : "Coming soon — fulfillment not verified"}</div>
            </div>
          </div>
        </Glass>

        <h2 className="mt-2 text-[15px] font-black">Delivery Option</h2>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <button onClick={()=>setDelivery("ship")} className={"rounded-[15px] border p-2 text-left "+(delivery==="ship"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}>
            <BnmTruckIcon size={20} />
            <b className="mt-1.5 block text-[10px]">Ship to Me</b>
            <span className="text-[7px] leading-3 text-[#91a2c2]">Requires verified fulfillment and shipping address</span>
          </button>
          <button onClick={()=>setDelivery("pickup")} className={"rounded-[15px] border p-2 text-left "+(delivery==="pickup"?"border-[#e746db] bg-[#1b244d] ring-1 ring-[#8e65ff]":"border-[#334a73] bg-[#0a1830]")}>
            <BnmMapPinIcon size={20} />
            <b className="mt-1.5 block text-[10px]">Pick Up Nearby</b>
            <span className="text-[7px] leading-3 text-[#91a2c2]">Only when a verified pickup partner exists</span>
          </button>
        </div>

        <Glass className="mt-1.5 p-2">
          <div className="flex items-center justify-between">
            <div><div className="text-[8px] font-black uppercase tracking-[.08em] text-[#8ea2c4]">Delivery details</div><div className="mt-0.5 text-[10px] font-black">{delivery === "ship" ? "No verified shipping address stored" : "No verified pickup location configured"}</div></div>
            <Link to="/Settings" className="text-[8px] font-black text-[#59caff]">Add / Edit</Link>
          </div>
          <p className="mt-1 text-[7px] leading-3 text-[#7f92b5]">The app will never invent an address, delivery estimate, store, or pickup partner.</p>
        </Glass>

        <Glass className="mt-1.5 p-2.5">
          <h2 className="text-[14px] font-black">Order Summary</h2>
          <div className="mt-2 flex items-center justify-between border-b border-[#243a5f] pb-2 text-[9px]"><span>{reward.name}</span><b>{formatCount(reward.points)} pts</b></div>
          <div className="mt-1.5 flex items-center justify-between text-[9px]"><span>Delivery</span><b>{available ? "Calculated at verified fulfillment" : "Unavailable"}</b></div>
          <div className="mt-2 flex items-center justify-between"><b className="text-[11px]">Total</b><b className="text-[12px] text-[#ff4fb3]">♥ {formatCount(reward.points)} points</b></div>
        </Glass>

        <Glass className="mt-1.5 p-2.5">
          <h2 className="text-[14px] font-black">Payment Method</h2>
          <div className="mt-1.5 flex items-center gap-2 rounded-[13px] border border-[#d34dd5] bg-[#141f43] p-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-[#ff47b8] to-[#6d6cff]">♥</span>
            <div className="min-w-0 flex-1"><b className="block text-[10px]">Redeem with Kindness Points</b><span className="text-[7px] text-[#93a5c5]">{channel ? "Available balance: "+formatCount(points) : "Sign in and create a channel first"}</span></div>
            <b className="text-[9px]">{formatCount(reward.points)} pts</b>
          </div>
        </Glass>

        {!enough && channel ? <div className="mt-1.5 rounded-[12px] border border-[#394f78] bg-[#0a1830] p-2 text-[8px] text-[#9fb0cf]">You need {formatCount(Math.max(0,reward.points-points))} more points for this reward.</div> : null}

        {message ? <div className={"mt-3 rounded-[14px] border p-3 text-[9px] "+(status==="success"?"border-emerald-400/30 bg-emerald-400/10 text-emerald-100":"border-red-400/30 bg-red-400/10 text-red-100")}>{status==="success"?<span className="mr-2 inline-flex align-middle"><BnmCheckCircleIcon size={16} /></span>:null}{message}</div> : null}

        <GradientButton
          onClick={claim}
          disabled={!channel||!enough||!available||status==="loading"||status==="success"}
          className="mt-1 w-full py-1.5 text-[12px]"
        >
          {status==="loading"?"Recording claim…":status==="success"?"Claim Recorded":available?"Claim Reward":"Reward Coming Soon"}
        </GradientButton>

        {!available ? <p className="mt-1.5 text-center text-[7px] leading-3 text-amber-100/75">Fulfillment remains locked until inventory or a verified partner is available.</p> : null}

        <div className="mt-2 grid grid-cols-3 gap-2 pb-2 text-center text-[7px] leading-3 text-[#8497b8]">
          <div className="flex flex-col items-center"><BnmShieldIcon size={18} /><span className="mb-1">Secure & Private</span></div>
          <div className="flex flex-col items-center"><BnmLeafSmallIcon size={18} /><span className="mb-1">Purpose Driven</span></div>
          <div className="flex flex-col items-center"><BnmLockIcon size={18} /><span className="mb-1">Verified Fulfillment</span></div>
        </div>
      </div>
    </BnmLockedScreen>
  );
}