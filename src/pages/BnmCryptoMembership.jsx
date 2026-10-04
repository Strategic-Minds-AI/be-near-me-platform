import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Coins, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BnmLockedScreen, Glass, GradientButton, Pill } from "@/components/bnm/LockedShell";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

export default function BnmCryptoMembership() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tier = params.get("tier") === "member_20" ? "member_20" : "member_10";
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await base44.functions.invoke("createCryptoMembershipQuote", { tier });
        const data = response?.data || response;
        if (data?.error) throw new Error(data.error);
        if (!cancelled) { setQuote(data); setStatus("ready"); }
      } catch (e) {
        if (!cancelled) { setError(e?.message || "Testnet crypto payments are not configured."); setStatus("blocked"); }
      }
    })();
    return () => { cancelled = true; };
  }, [tier]);

  const send = async () => {
    setError("");
    if (!quote) return;
    if (!window.ethereum) {
      setError("A browser wallet compatible with Ethereum is required for the Sepolia test.");
      return;
    }
    setStatus("sending");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const from = accounts?.[0];
      if (!from) throw new Error("No wallet account selected.");

      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID }] });
      } catch (switchError) {
        if (switchError?.code !== 4902) throw switchError;
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID, chainName: "Sepolia", nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://rpc.sepolia.org"], blockExplorerUrls: ["https://sepolia.etherscan.io"] }]
        });
      }

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from, to: quote.receiver, value: "0x" + BigInt(quote.amount_atomic).toString(16) }]
      });
      setTxHash(hash);
      setStatus("verifying");

      const verify = await base44.functions.invoke("verifyCryptoMembershipPayment", { tier, tx_hash: hash });
      const data = verify?.data || verify;
      if (data?.error) throw new Error(data.error);
      setStatus("verified");
    } catch (e) {
      setError(e?.message || "Testnet transaction could not be verified.");
      setStatus("ready");
    }
  };

  return (
    <BnmLockedScreen>
      <div className="px-3 py-4">
        <Glass className="p-4">
          <Pill active><Coins className="h-3.5 w-3.5" /> Crypto Testnet</Pill>
          <h1 className="mt-3 text-[25px] font-black tracking-[-.04em]">Verify the crypto membership flow</h1>
          <p className="mt-2 text-[10px] leading-5 text-[#97a9ca]">
            Sepolia only. No real-dollar membership is activated by an unverified browser claim; the backend re-fetches and validates the chain transaction.
          </p>
        </Glass>

        <Glass className="mt-3 p-4">
          {status === "loading" ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : null}

          {quote ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-[10px] text-[#8fa1c3]">Membership</span><b className="text-sm">{tier === "member_10" ? "$10 / 25 IC" : "$20 / 50 IC"}</b></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-[#8fa1c3]">Network</span><b className="text-sm">Sepolia</b></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[10px] text-[#8fa1c3]">Test amount</span><code className="break-all text-right text-[9px]">{quote.amount_atomic} wei</code></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[10px] text-[#8fa1c3]">Receiver</span><code className="max-w-[220px] break-all text-right text-[8px]">{quote.receiver}</code></div>
              <p className="rounded-[12px] border border-[#5b4a8f]/30 bg-[#5b4a8f]/10 p-3 text-[8px] leading-4 text-[#b8aed2]">{quote.note}</p>

              {status === "verified" ? (
                <div className="rounded-[14px] border border-emerald-400/30 bg-emerald-400/10 p-3 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-300" />
                  <div className="mt-2 text-[11px] font-black text-emerald-200">Sepolia payment verified</div>
                  <p className="mt-1 text-[8px] leading-4 text-emerald-100/70">Membership entitlement is recorded. Infinity Coin remains pending governed mint execution.</p>
                </div>
              ) : (
                <GradientButton className="w-full" disabled={status === "sending" || status === "verifying"} onClick={send}>
                  {status === "sending" || status === "verifying" ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{status === "sending" ? "Confirm in wallet…" : "Verifying chain…"}</> : "Send Sepolia Test Payment"}
                </GradientButton>
              )}
            </div>
          ) : null}

          {error ? <div className="mt-3 rounded-[12px] border border-amber-400/30 bg-amber-400/10 p-3 text-[9px] leading-4 text-amber-100">{error}</div> : null}
          {txHash ? <div className="mt-3 text-[8px] text-[#8799bb]">Transaction: <code className="break-all">{txHash}</code></div> : null}
        </Glass>

        <Glass className="mt-3 p-4">
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#59d6bb]" /><p className="text-[9px] leading-4 text-[#8fa1c3]">Mainnet crypto payments, real funds, and live token minting remain blocked until the protected production release gate.</p></div>
          <button type="button" onClick={() => navigate("/membership")} className="mt-3 flex items-center gap-1 text-[9px] font-black text-[#a998ff]">Back to memberships <ExternalLink className="h-3 w-3" /></button>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
