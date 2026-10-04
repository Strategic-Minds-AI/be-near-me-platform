import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  BnmLockedScreen,
  Glass,
  GradientButton,
  Pill,
} from "@/components/bnm/LockedShell";

export default function BnmAccount() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const requestedNext = params.get("next") || "/home";
  const safeNext =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/home";

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-4">
        <Glass className="p-5">
          <div className="flex items-center justify-between gap-3">
            <Pill active>
              <UserRound className="h-3.5 w-3.5" />
              Be Near Me Account
            </Pill>
            <ShieldCheck className="h-5 w-5 text-[#66d6ff]" />
          </div>

          <h1 className="mt-4 text-[26px] font-black tracking-[-0.045em]">
            Google is not the entry gate.
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#9cafcf]">
            This build keeps Be Near Me usable without sending people into an
            external Google/Base44 login flow. Browsing, discovery, the Create
            hub, camera access, and public experiences remain available.
          </p>

          <div className="mt-4 rounded-[16px] border border-[#30496f] bg-[#08162b] p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff55bd]" />
              <p className="text-[11px] leading-5 text-[#aebcD6]">
                Account-owned actions such as publishing, creator ownership,
                private messages, rewards, and persistent history still require
                an authenticated backend identity. The replacement must be a
                native Be Near Me identity flow rather than a Google gate.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <GradientButton
              type="button"
              className="flex w-full items-center justify-center gap-2"
              onClick={() => navigate(safeNext === "/account" ? "/home" : safeNext)}
            >
              Continue in Be Near Me
              <ArrowRight className="h-4 w-4" />
            </GradientButton>

            <button
              type="button"
              onClick={() => navigate("/create")}
              className="w-full rounded-full border border-[#3b557f] bg-[#0a1830] px-4 py-3 text-sm font-black text-white"
            >
              Open Create Hub
            </button>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
