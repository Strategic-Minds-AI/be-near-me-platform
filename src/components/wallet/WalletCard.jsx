import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Copy, Check, RefreshCw, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const RPC = {
  mainnet: "https://eth.llamarpc.com",
  sepolia: "https://eth-sepolia.publicnode.com",
};

export default function WalletCard({ wallet }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC[wallet.network] || RPC.mainnet);
      const bal = await provider.getBalance(wallet.address);
      setBalance(ethers.formatEther(bal));
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, wallet.network]);

  const copy = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
            <WalletIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-white leading-tight">{wallet.label || "Ethereum wallet"}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${wallet.network === "mainnet" ? "bg-pink-500/20 text-pink-300" : "bg-fuchsia-500/20 text-fuchsia-300"}`}>
              {wallet.network}{wallet.network === "sepolia" && " · testnet"}
            </span>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" onClick={fetchBalance}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <button onClick={copy} className="flex items-center gap-2 text-left group">
        <span className="font-mono text-sm text-gray-300 break-all">{wallet.address}</span>
        {copied ? <Check className="w-4 h-4 text-pink-400 shrink-0" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-white shrink-0" />}
      </button>

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-xs text-gray-500">Balance</span>
        <span className="font-semibold text-white">
          {balance !== null ? `${parseFloat(balance).toFixed(4)} ETH` : "—"}
        </span>
      </div>
    </div>
  );
}