import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { nativeAuth } from "@/lib/nativeAuth";
import {
  BnmLockedScreen,
  Glass,
  GradientButton,
  Pill,
} from "@/components/bnm/LockedShell";

export default function BnmAccount() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestedNext = params.get("next") || "/home";
  const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/home";
  const configured = nativeAuth.isConfigured();

  const complete = () => navigate(safeNext === "/account" ? "/home" : safeNext);

  const submitPassword = async () => {
    setError("");
    setMessage("");
    if (!configured) {
      setError("Native Be Near Me accounts are not connected in this preview environment yet.");
      return;
    }
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");

    setBusy("password");
    try {
      if (mode === "signup") {
        const result = await nativeAuth.signUp({ email: email.trim(), password, fullName: fullName.trim() });
        if (result?.session) complete();
        else setMessage("Account created. Check your email if confirmation is required, then sign in.");
      } else {
        await nativeAuth.signInWithPassword({ email: email.trim(), password });
        complete();
      }
    } catch (e) {
      setError(e?.message || "Account request failed.");
    } finally {
      setBusy("");
    }
  };

  const sendMagicLink = async () => {
    setError("");
    setMessage("");
    if (!configured) {
      setError("Native Be Near Me accounts are not connected in this preview environment yet.");
      return;
    }
    if (!email.trim()) return setError("Enter your email.");

    setBusy("magic");
    try {
      const redirectTo = window.location.origin + safeNext;
      await nativeAuth.sendMagicLink(email.trim(), redirectTo);
      setMessage("Check your email for your Be Near Me sign-in link.");
    } catch (e) {
      setError(e?.message || "Could not send sign-in link.");
    } finally {
      setBusy("");
    }
  };

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-4 pb-5">
        <Glass className="p-5">
          <div className="flex items-center justify-between gap-3">
            <Pill active><UserRound className="h-3.5 w-3.5" /> Be Near Me Account</Pill>
            <ShieldCheck className="h-5 w-5 text-[#66d6ff]" />
          </div>

          <h1 className="mt-4 text-[26px] font-black tracking-[-0.045em]">
            Your Be Near Me identity
          </h1>
          <p className="mt-2 text-[11px] leading-5 text-[#9cafcf]">
            Public browsing and the Create hub stay open. An account is required only when an action needs durable ownership, private data, payments, or Infinity Coin eligibility.
          </p>

          <div className="mt-4 grid grid-cols-2 rounded-full border border-[#30496f] bg-[#08162b] p-1">
            <button type="button" onClick={() => setMode("signup")} className={"rounded-full py-2 text-[10px] font-black " + (mode === "signup" ? "bg-gradient-to-r from-[#ff168f] to-[#764cff] text-white" : "text-[#8fa2c3]")}>Create Account</button>
            <button type="button" onClick={() => setMode("signin")} className={"rounded-full py-2 text-[10px] font-black " + (mode === "signin" ? "bg-gradient-to-r from-[#ff168f] to-[#764cff] text-white" : "text-[#8fa2c3]")}>Sign In</button>
          </div>

          {!configured ? (
            <div className="mt-4 rounded-[14px] border border-amber-400/30 bg-amber-400/10 p-3 text-[9px] leading-4 text-amber-100">
              Native account code is staged, but this preview is not bound to a dedicated Be Near Me Supabase project. No external login redirect is used as a substitute.
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {mode === "signup" ? (
              <label className="block">
                <span className="text-[9px] font-black text-[#9cafcf]">Name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value.slice(0, 100))} placeholder="Your name" className="mt-1 w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]" />
              </label>
            ) : null}

            <label className="block">
              <span className="text-[9px] font-black text-[#9cafcf]">Email</span>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#7184a8]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#7184a8]" />
              </div>
            </label>

            <label className="block">
              <span className="text-[9px] font-black text-[#9cafcf]">Password</span>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-[#7184a8]" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#7184a8]" />
              </div>
            </label>

            {error ? <div className="rounded-[12px] border border-red-400/30 bg-red-400/10 px-3 py-2 text-[9px] leading-4 text-red-200">{error}</div> : null}
            {message ? <div className="rounded-[12px] border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[9px] leading-4 text-emerald-200">{message}</div> : null}

            <GradientButton type="button" className="flex w-full items-center justify-center gap-2" disabled={busy === "password"} onClick={submitPassword}>
              {busy === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signup" ? "Create Be Near Me Account" : "Sign In"}
            </GradientButton>

            <button type="button" disabled={busy === "magic"} onClick={sendMagicLink} className="w-full rounded-full border border-[#3b557f] bg-[#0a1830] px-4 py-3 text-[10px] font-black text-white">
              {busy === "magic" ? "Sending…" : "Email me a sign-in link"}
            </button>
          </div>
        </Glass>

        <button type="button" onClick={() => navigate("/home")} className="mt-3 flex w-full items-center justify-center gap-2 py-3 text-[10px] font-black text-[#9cafcf]">
          Continue public experience <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </BnmLockedScreen>
  );
}
