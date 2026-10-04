import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  GradientButton,
  Pill,
  asItems,
} from "@/components/bnm/LockedShell";

const RULES_VERSION = "1.0.0";

const COMMUNITY_COMMITMENTS = [
  "Treat people with respect. Bullying, harassment, and shaming are not welcome.",
  "Keep challenges safe, constructive, and appropriate for the people involved.",
  "Share personal information only when you choose to.",
  "Use local and community features responsibly and respect other people's privacy.",
];

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

export default function BnmLockedOnboarding() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [signature, setSignature] = useState("");
  const [charity, setCharity] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPositivity, setAgreedPositivity] = useState(false);
  const [agreedFeatureTerms, setAgreedFeatureTerms] = useState(false);
  const [error, setError] = useState("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ["bnm-onboarding-signature", user?.email],
    queryFn: async () =>
      asItems(
        await base44.entities.DigitalSignature.filter(
          { created_by: user.email },
          { sort: "-created_date", limit: 1 }
        )
      ),
    enabled: Boolean(user?.email),
  });

  const completed = Boolean(signatures[0]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Sign in is required.");
      if (
        !fullName.trim() ||
        !signature.trim() ||
        !agreedTerms ||
        !agreedPositivity ||
        !agreedFeatureTerms
      ) {
        throw new Error("Complete the required agreement fields.");
      }

      await base44.entities.DigitalSignature.create({
        user_email: user.email,
        user_name: fullName.trim(),
        signature_text: signature.trim(),
        rules_version: RULES_VERSION,
        agreed_to_terms: agreedTerms,
        agreed_to_positivity_pledge: agreedPositivity,
        // Existing backend schema field retained during Base44 convergence.
        agreed_to_crypto_terms: agreedFeatureTerms,
        charity_choice: charity.trim(),
        signed_at: new Date().toISOString(),
        description: "Be Near Me community onboarding agreement",
      });
    },
    onSuccess: () => navigate("/home"),
    onError: (mutationError) =>
      setError(mutationError?.message || "Could not complete onboarding."),
  });

  if (!user) {
    return (
      <BnmLockedScreen>
        <div className="px-3 pt-6">
          <EmptyState
            icon={Sparkles}
            title="Welcome to Be Near Me"
            body="Sign in to finish your account setup."
          />
          <div className="mt-4 text-center">
            <GradientButton
              type="button"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Sign In
            </GradientButton>
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  if (isLoading) {
    return (
      <BnmLockedScreen>
        <div className="grid min-h-[60dvh] place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#a38bff]" />
        </div>
      </BnmLockedScreen>
    );
  }

  if (completed) {
    return (
      <BnmLockedScreen>
        <div className="px-3 pt-6">
          <EmptyState
            icon={CheckCircle2}
            title="Account setup complete"
            body="Your Be Near Me community agreement is already recorded."
          />
          <div className="mt-4 text-center">
            <GradientButton type="button" onClick={() => navigate("/home")}>
              Go to Feed
            </GradientButton>
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Welcome</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Join Be Near Me
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8fa0c4]">
            Confirm the community basics before you start creating and connecting.
          </p>
        </Glass>

        <Glass className="mt-3 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#a38bff]" />
            <h2 className="text-sm font-black text-white">
              Community Commitments
            </h2>
          </div>

          <div className="mt-3 space-y-2">
            {COMMUNITY_COMMITMENTS.map((rule) => (
              <div key={rule} className="flex gap-2 rounded-[14px] bg-[#0a1832] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#65d6b4]" />
                <p className="text-[11px] leading-5 text-[#b4c2dc]">{rule}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value.slice(0, 100))}
              placeholder="Your full name"
              className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />

            <input
              value={charity}
              onChange={(event) => setCharity(event.target.value.slice(0, 120))}
              placeholder="Cause or charity you care about (optional)"
              className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />

            <label className="flex items-start gap-3 rounded-[14px] border border-[#2c456f] bg-[#08162b] p-3">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(event) => setAgreedTerms(event.target.checked)}
                className="mt-1"
              />
              <span className="text-[11px] leading-5 text-[#b4c2dc]">
                I agree to the current Be Near Me terms and community rules.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[14px] border border-[#2c456f] bg-[#08162b] p-3">
              <input
                type="checkbox"
                checked={agreedPositivity}
                onChange={(event) => setAgreedPositivity(event.target.checked)}
                className="mt-1"
              />
              <span className="text-[11px] leading-5 text-[#b4c2dc]">
                I agree to participate respectfully and avoid bullying, harassment, or shaming.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[14px] border border-[#2c456f] bg-[#08162b] p-3">
              <input
                type="checkbox"
                checked={agreedFeatureTerms}
                onChange={(event) => setAgreedFeatureTerms(event.target.checked)}
                className="mt-1"
              />
              <span className="text-[11px] leading-5 text-[#b4c2dc]">
                I understand that optional rewards or account features may have additional terms when enabled.
              </span>
            </label>

            <input
              value={signature}
              onChange={(event) => setSignature(event.target.value.slice(0, 100))}
              placeholder="Type your name as your signature"
              className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm italic text-white outline-none placeholder:text-[#7184a8]"
            />

            {error ? (
              <p className="rounded-[12px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {error}
              </p>
            ) : null}

            <GradientButton
              type="button"
              className="flex w-full items-center justify-center gap-2"
              disabled={
                !fullName.trim() ||
                !signature.trim() ||
                !agreedTerms ||
                !agreedPositivity ||
                !agreedFeatureTerms ||
                saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Complete Setup"
              )}
            </GradientButton>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
