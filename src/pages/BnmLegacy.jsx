import { Heart, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { BnmLockedScreen, Glass } from "@/components/bnm/LockedShell";

export default function BnmLegacy() {
  return (
    <BnmLockedScreen>
      <div className="px-4 py-10">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-gradient-to-br from-[#25c9ff] via-[#8d53ff] to-[#ff3aaa] shadow-[0_0_45px_rgba(139,83,255,.35)]">
            <Heart className="h-9 w-9 text-white" fill="white" />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#8fa5d0]">The reason this exists</p>
          <h1 className="mt-3 text-[36px] font-black leading-[1.02] tracking-[-.05em]">For Eva & Anastasia</h1>
          <p className="mt-5 text-[15px] leading-7 text-[#aebddb]">Be Near Me is dedicated to Eva and Anastasia — a platform built around the idea that technology can help people choose kindness, connection, creativity, and positive action.</p>
        </div>

        <Glass className="mt-8 p-5">
          <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-[#bd77ff]"/><div><h2 className="font-black">Product law</h2><p className="mt-1 text-xs leading-5 text-[#93a6c8]">The approved visual experience is preserved as BNM-EA-V1. Future changes may improve capability, safety, and accessibility without silently replacing the approved product identity.</p></div></div>
          <div className="mt-5 flex items-start gap-3"><InfinityIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#55d8ff]"/><div><h2 className="font-black">Revenue law</h2><p className="mt-1 text-xs leading-5 text-[#93a6c8]">The platform retained share of platform net receipts is 0%. The economic beneficiary pool is assigned 100% to Eva and Anastasia, subject to a legally valid verified settlement configuration.</p></div></div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
