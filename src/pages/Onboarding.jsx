import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Heart, Wallet, Shield, CheckCircle2, Coins, ArrowRight, ArrowLeft, PenLine } from "lucide-react";

const CHARITIES = [
  "American Red Cross",
  "Doctors Without Borders",
  "St. Jude Children's Research Hospital",
  "World Wildlife Fund",
  "Make-A-Wish Foundation",
  "Feeding America",
  "Habitat for Humanity",
  "The Trevor Project",
  "UNICEF",
  "Wounded Warrior Project",
];

const RULES_VERSION = "1.0.0";

const COMMUNITY_RULES = [
  "Zero negativity, bullying, shame, or harassment — ever.",
  "Every user is equal. No hierarchies, no status flexing, no exclusion.",
  "Dares must be kind, safe, and something you'd be proud of.",
  "Truths are shared willingly — never pressure someone to reveal more than they want.",
  "Crypto rewards kindness — they are never the goal, only the reward.",
  "Every user chooses a charity at signup, so participation always gives back.",
  "Three strikes and you're out — but re-annihilation is possible after 6 months.",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [charity, setCharity] = useState("");
  const [customCharity, setCustomCharity] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPositivity, setAgreedPositivity] = useState(false);
  const [agreedCrypto, setAgreedCrypto] = useState(false);
  const [signature, setSignature] = useState("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: existingSig } = useQuery({
    queryKey: ["mySignature", user?.email],
    queryFn: () => base44.entities.DigitalSignature.filter({ created_by: user?.email }, { limit: 1 }),
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.DigitalSignature.create(data);
    },
    onSuccess: () => {
      setStep(5);
    },
  });

  const steps = ["Welcome", "Charity", "Wallet", "AI Buddy", "Rules & Signature", "Done"];
  const progress = (step / (steps.length - 1)) * 100;

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f] text-white p-6">
        <div className="text-center max-w-sm">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-pink-500" />
          <h2 className="text-xl font-semibold mb-2">Welcome to Be Near Me</h2>
          <p className="text-gray-400 mb-6 text-sm">Sign in to start your onboarding journey.</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full px-6">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (existingSig && existingSig.length > 0 && step < 5) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0f0f0f] text-white p-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold mb-2">You're all set!</h2>
          <p className="text-gray-400 mb-6 text-sm">You've already completed onboarding. Ready to spread some kindness?</p>
          <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full px-6">
            Go to Feed
          </Button>
        </div>
      </div>
    );
  }

  const handleSign = () => {
    if (!fullName.trim() || !signature.trim() || !agreedTerms || !agreedPositivity || !agreedCrypto) return;
    const chosenCharity = customCharity.trim() || charity;
    saveMutation.mutate({
      user_email: user.email,
      user_name: fullName.trim(),
      signature_text: signature.trim(),
      rules_version: RULES_VERSION,
      agreed_to_terms: agreedTerms,
      agreed_to_positivity_pledge: agreedPositivity,
      agreed_to_crypto_terms: agreedCrypto,
      charity_choice: chosenCharity,
      signed_at: new Date().toISOString(),
      description: `Digital signature onboarding for ${user.email}`,
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Onboarding</span>
            <span className="text-sm text-gray-400">{step + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-fuchsia-600" />
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <span key={s} className={`text-[10px] ${i <= step ? "text-pink-400" : "text-gray-600"}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="bg-white/5 border-white/10 text-center">
            <CardContent className="pt-12 pb-10 px-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-fuchsia-600/20 mb-6">
                <Sparkles className="w-10 h-10 text-pink-500" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Welcome to Be Near Me</h1>
              <p className="text-gray-400 mb-2 max-w-md mx-auto">
                A positivity-only platform where you dare friends to spread kindness, share truths that build connection, and earn Infinity Coin for doing good.
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                Let's get you set up — it takes about 2 minutes.
              </p>
              <Button onClick={() => setStep(1)} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full px-8 h-12">
                Let's Go <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Charity */}
        {step === 1 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-500" />
                <div>
                  <CardTitle className="text-white">Choose Your Charity</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">10% of any removed user's tokens go to charity. Pick one close to your heart.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {CHARITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCharity(c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    charity === c
                      ? "border-pink-500 bg-pink-500/10 text-white"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20"
                  }`}
                >
                  {c}
                </button>
              ))}
              <div className="pt-2">
                <Label className="text-gray-400 text-sm">Or type your own charity:</Label>
                <Input
                  value={customCharity}
                  onChange={(e) => setCustomCharity(e.target.value)}
                  placeholder="Charity name..."
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)} className="text-gray-400">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!charity && !customCharity.trim()}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full px-6"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Wallet */}
        {step === 2 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-pink-500" />
                <div>
                  <CardTitle className="text-white">Your Crypto Wallet</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Every user gets an Ethereum wallet for Infinity Coin rewards. Private keys never leave your device.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <Coins className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium">Infinity Coin</p>
                  <p className="text-xs text-gray-400 mt-1">Earn Infinity Coin by completing kindness dares and sharing truths. Spend it, hold it, or let it support your charity.</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                You can create your wallet now or later from the Wallet page. Your AI Buddy can walk you through it anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate("/Wallet")} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex-1">
                  Create Wallet Now
                </Button>
                <Button variant="outline" onClick={() => setStep(3)} className="rounded-full flex-1 border-white/20 text-white">
                  I'll Do It Later
                </Button>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-400">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: AI Buddy */}
        {step === 3 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-pink-500" />
                <div>
                  <CardTitle className="text-white">Meet Your AI Buddy</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Your personal positivity companion — here to inspire kindness dares and guide good choices.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-fuchsia-600/10 border border-pink-500/20">
                <p className="text-sm text-white">Hey! I'm your Buddy 👋</p>
                <p className="text-xs text-gray-400 mt-2">
                  I'll suggest kindness dare ideas, help you craft dares for friends, celebrate your wins, and keep things positive. Chat with me anytime from the sidebar.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate("/AIBuddy")} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex-1">
                  Meet Buddy Now
                </Button>
                <Button variant="outline" onClick={() => setStep(4)} className="rounded-full flex-1 border-white/20 text-white">
                  Continue
                </Button>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Rules & Signature */}
        {step === 4 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-pink-500" />
                <div>
                  <CardTitle className="text-white">Community Rules & Signature</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Read the rules, agree, and sign to join the community.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {COMMUNITY_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <Checkbox id="terms" checked={agreedTerms} onCheckedChange={setAgreedTerms} />
                  <Label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                    I agree to the Terms of Service and Community Rules (v{RULES_VERSION})
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="positivity" checked={agreedPositivity} onCheckedChange={setAgreedPositivity} />
                  <Label htmlFor="positivity" className="text-sm text-gray-300 cursor-pointer">
                    I pledge to keep Be Near Me positive — zero negativity, bullying, or shame
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="crypto" checked={agreedCrypto} onCheckedChange={setAgreedCrypto} />
                  <Label htmlFor="crypto" className="text-sm text-gray-300 cursor-pointer">
                    I understand crypto wallet risks and take responsibility for my private keys
                  </Label>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <div>
                  <Label className="text-gray-400 text-sm">Your full name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-sm flex items-center gap-1">
                    <PenLine className="w-3 h-3" /> Type your name as your digital signature
                  </Label>
                  <Input
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Jane Doe"
                    className="mt-1 bg-white/5 border-white/10 text-white font-[cursive] italic"
                  />
                </div>
                <p className="text-[10px] text-gray-600">
                  By signing, you create a legally binding e-signature under the ESIGN Act and UETA. Your signature is recorded with a timestamp.
                </p>
              </div>

              {saveMutation.isError && (
                <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(3)} className="text-gray-400">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={!fullName.trim() || !signature.trim() || !agreedTerms || !agreedPositivity || !agreedCrypto || saveMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full px-6"
                >
                  {saveMutation.isPending ? "Signing..." : "Sign & Join"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <Card className="bg-white/5 border-white/10 text-center">
            <CardContent className="pt-12 pb-10 px-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold mb-3">You're In! 🎉</h1>
              <p className="text-gray-400 mb-2 max-w-md mx-auto">
                Welcome to the Be Near Me community. Your signature is recorded, your charity is set, and your AI Buddy is waiting.
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                Now go spread some kindness. Dare a friend. Share a truth. Earn Infinity Coin. Make the world a little brighter.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <Button onClick={() => navigate("/AIBuddy")} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-full flex-1">
                  Meet Buddy
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="rounded-full flex-1 border-white/20 text-white">
                  Go to Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}