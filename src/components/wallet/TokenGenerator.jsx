import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ethers } from "ethers";
import { Coins, Loader2, Sparkles, Check, ShieldCheck, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TokenGenerator() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [supply, setSupply] = useState("1000000");
  const [supplyModel, setSupplyModel] = useState("fixed");
  const [walletId, setWalletId] = useState("");
  const [creating, setCreating] = useState(false);
  const [last, setLast] = useState(null);

  const userQ = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const walletsQ = useQuery({
    queryKey: ["myWallets", userQ.data?.email],
    queryFn: () =>
      base44.entities.Wallet.filter(
        { created_by: userQ.data?.email },
        { sort: "-created_date", limit: 50 }
      ),
    enabled: !!userQ.data?.email,
  });
  const wallets = walletsQ.data?.items || [];

  const isUnlimited = supplyModel === "unlimited_mintable";
  const isInfinityCoin = name.trim().toLowerCase() === "infinity coin";

  const useInfinityTemplate = () => {
    setName("Infinity Coin");
    setSymbol("IC");
    setDecimals("18");
    setSupply("0");
    setSupplyModel("unlimited_mintable");
    const sepolia = wallets.find((wallet) => wallet.network === "sepolia");
    if (sepolia) setWalletId(sepolia.id);
  };

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!/^[A-Z]{2,6}$/.test(symbol.trim())) return "Symbol must be 2-6 uppercase letters";
    const d = Number(decimals);
    if (!Number.isInteger(d) || d < 0 || d > 18) return "Decimals must be 0-18";
    if (!isUnlimited && (!/^\d+$/.test(supply.trim()) || BigInt(supply) <= 0n)) return "Total supply must be a positive integer";
    if (!walletId) return "Select a deploying wallet";
    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet) return "Wallet not found";
    if (isInfinityCoin && wallet.network !== "sepolia") return "Infinity Coin must remain on Sepolia until mainnet release is explicitly approved";
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Invalid input", description: err, variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const wallet = wallets.find((w) => w.id === walletId);
      if (!wallet) throw new Error("Wallet not found");

      const deployer = ethers.getAddress(wallet.address);
      if (!ethers.isAddress(deployer)) throw new Error("Deployer address failed validation");

      let contractAddress;
      try {
        contractAddress = ethers.getCreateAddress(deployer, 0);
      } catch {
        const salt = ethers.id(symbol.trim());
        contractAddress = ethers.getCreate2Address(
          deployer,
          ethers.keccak256(salt),
          ethers.keccak256("0x")
        );
      }
      contractAddress = ethers.getAddress(contractAddress);
      if (!ethers.isAddress(contractAddress)) throw new Error("Prospective contract address failed validation");

      await base44.entities.Token.create({
        name: name.trim(),
        symbol: symbol.trim(),
        decimals: Number(decimals),
        total_supply: isUnlimited ? "0" : supply.trim(),
        supply_model: supplyModel,
        mintable: isUnlimited,
        max_supply: isUnlimited ? "" : supply.trim(),
        mint_authority_mode: isUnlimited ? "governed_backend" : "none",
        policy_id: isInfinityCoin ? "BNM-INFINITY-COIN-V1" : "",
        contract_address: contractAddress,
        network: wallet.network || "sepolia",
        wallet_id: wallet.id,
        deployer_address: deployer,
        status: "defined",
        deployment_tx_hash: "",
        deployment_validator_status: "BLOCKED",
        description: isInfinityCoin
          ? "Infinity Coin community utility/reward token definition. Unlimited mintable supply; deployment and minting require governed backend authority and independent validation."
          : "No-code ERC-20 token definition. A derived address is prospective until on-chain deployment is independently verified.",
      });

      setLast({ name: name.trim(), symbol: symbol.trim(), contractAddress, supplyModel });
      setName(""); setSymbol(""); setSupply("1000000"); setDecimals("18"); setSupplyModel("fixed"); setWalletId("");
      qc.invalidateQueries({ queryKey: ["myTokens"] });
      toast({
        title: "Token definition saved",
        description: "No deployment is claimed until an on-chain transaction is independently verified.",
      });
    } catch (e) {
      toast({ title: "Could not define token", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-pink-400" /> No-Code ERC-20 Generator
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={useInfinityTemplate} className="border-fuchsia-500/30 text-fuchsia-200">
          <InfinityIcon className="w-4 h-4 mr-1" /> Infinity Coin
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400">Token name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Infinity Coin" className="mt-1 bg-white/5 border-white/10 text-white" />
        </div>
        <div>
          <Label className="text-gray-400">Symbol</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="IC" maxLength={6} className="mt-1 bg-white/5 border-white/10 text-white uppercase" />
        </div>
        <div>
          <Label className="text-gray-400">Decimals</Label>
          <Input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} min={0} max={18} className="mt-1 bg-white/5 border-white/10 text-white" />
        </div>
        <div>
          <Label className="text-gray-400">Supply model</Label>
          <Select value={supplyModel} onValueChange={setSupplyModel}>
            <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectItem value="fixed">Fixed supply</SelectItem>
              <SelectItem value="unlimited_mintable">Unlimited / mintable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!isUnlimited ? (
          <div className="sm:col-span-2">
            <Label className="text-gray-400">Total supply</Label>
            <Input value={supply} onChange={(e) => setSupply(e.target.value)} placeholder="1000000" className="mt-1 bg-white/5 border-white/10 text-white" />
          </div>
        ) : (
          <div className="sm:col-span-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-100/80">
            No permanent maximum supply. Mint authority is assigned to the governed backend execution path; the browser cannot mint.
          </div>
        )}
      </div>

      <div className="mt-3">
        <Label className="text-gray-400">Deploying wallet</Label>
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue placeholder="Choose a wallet…" /></SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
            {wallets.length === 0 && <SelectItem value="none" disabled>No wallets yet</SelectItem>}
            {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.label || w.address.slice(0, 8)}… · {w.network}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleCreate} disabled={creating} className="w-full mt-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white">
        {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Save Token Definition
      </Button>

      <div className="flex items-start gap-2 mt-3 text-xs text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-pink-400" />
        A derived address is prospective. This generator never claims a deployment or mint without an independently verified on-chain transaction.
      </div>

      {last && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-green-200 text-sm">
          <div className="flex items-center gap-2 font-semibold mb-1"><Check className="w-4 h-4" /> {last.name} ({last.symbol}) definition saved</div>
          <p className="font-mono text-xs break-all text-green-100/80">{last.contractAddress}</p>
          <p className="mt-1 text-xs text-green-100/70">{last.supplyModel === "unlimited_mintable" ? "Unlimited / mintable · governed mint" : "Fixed supply"} · deployment not yet claimed</p>
        </div>
      )}
    </div>
  );
}
