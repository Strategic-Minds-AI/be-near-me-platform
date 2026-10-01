import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ethers } from "ethers";
import {
  Wallet as WalletIcon,
  Plus,
  Download,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import CreateWalletModal from "@/components/wallet/CreateWalletModal";
import WalletCard from "@/components/wallet/WalletCard";

export default function Wallet() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [network, setNetwork] = useState("mainnet");
  const [modal, setModal] = useState(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [label, setLabel] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const walletsQ = useQuery({
    queryKey: ["myWallets", user?.email],
    queryFn: () =>
      base44.entities.Wallet.filter(
        { created_by: user?.email },
        { sort: "-created_date", limit: 50 }
      ),
    enabled: !!user?.email,
  });
  const wallets = walletsQ.data || [];

  if (!userLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <WalletIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Your Crypto Wallet</h1>
        <p className="text-gray-400 max-w-md">
          Sign in to generate a secure Ethereum wallet. Your keys stay in your browser — we only store your public address.
        </p>
        <Button
          onClick={() => base44.auth.redirectToLogin()}
          className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
        >
          Sign In to Continue
        </Button>
      </div>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    try {
      const w = ethers.Wallet.createRandom();
      const address = ethers.getAddress(w.address);
      if (!ethers.isAddress(address)) throw new Error("Generated address failed validation");
      await base44.entities.Wallet.create({
        address,
        chain: "ethereum",
        network,
        label: label || `${network === "mainnet" ? "Mainnet" : "Sepolia"} wallet`,
      });
      setModal({ address, mnemonic: w.mnemonic.phrase });
      setLabel("");
      qc.invalidateQueries({ queryKey: ["myWallets"] });
      toast({ title: "Wallet created ✓", description: "Validated address saved." });
    } catch (e) {
      toast({ title: "Could not create wallet", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const w = ethers.Wallet.fromPhrase(mnemonic.trim());
      const address = ethers.getAddress(w.address);
      if (!ethers.isAddress(address)) throw new Error("Invalid address");
      await base44.entities.Wallet.create({
        address,
        chain: "ethereum",
        network,
        label: label || "Imported wallet",
      });
      setMnemonic("");
      setLabel("");
      qc.invalidateQueries({ queryKey: ["myWallets"] });
      toast({ title: "Wallet imported ✓", description: address });
    } catch (e) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 flex items-center justify-center">
          <WalletIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Crypto Wallet</h1>
          <p className="text-sm text-gray-400">Generate and manage Ethereum wallets</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 mb-6 text-xs text-gray-400">
        <Shield className="w-4 h-4 text-pink-400" />
        Keys are generated in your browser and never stored. We only save your public address.
      </div>

      <div className="inline-flex rounded-full bg-white/5 border border-white/10 p-1 mb-6">
        {["mainnet", "sepolia"].map((n) => (
          <button
            key={n}
            onClick={() => setNetwork(n)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
              network === n
                ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {n}{n === "sepolia" && " (testnet)"}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-pink-400" /> Create new wallet
          </h2>
          <Label className="text-gray-400">Label (optional)</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My savings wallet"
            className="mt-1 mb-3 bg-white/5 border-white/10 text-white"
          />
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
          >
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Wallet
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            A new keypair is created locally. Your 12-word recovery phrase appears once — save it.
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-pink-400" /> Import wallet
          </h2>
          <Label className="text-gray-400">Recovery phrase</Label>
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="enter your 12-word phrase"
            rows={2}
            className="mt-1 mb-3 w-full rounded-md bg-white/5 border border-white/10 text-white p-2 text-sm font-mono"
          />
          <Button
            onClick={handleImport}
            disabled={importing || !mnemonic.trim()}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Import
          </Button>
          <p className="text-xs text-gray-500 mt-3">
            Processed locally in your browser. Your phrase is never sent to our servers.
          </p>
        </div>
      </div>

      <h2 className="font-semibold text-white mt-8 mb-3">Your wallets ({wallets.length})</h2>
      {walletsQ.isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : wallets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-gray-500">
          No wallets yet — create your first one above.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} />
          ))}
        </div>
      )}

      {modal && <CreateWalletModal data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}