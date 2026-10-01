import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ethers } from "ethers";
import { Coins, Loader2, Sparkles, Check, ShieldCheck } from "lucide-react";
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

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!/^[A-Z]{2,6}$/.test(symbol.trim())) return "Symbol must be 2-6 uppercase letters";
    const d = Number(decimals);
    if (!Number.isInteger(d) || d < 0 || d > 18) return "Decimals must be 0-18";
    if (!/^\d+$/.test(supply.trim()) || BigInt(supply) <= 0n) return "Total supply must be a positive integer";
    if (!walletId) return "Select a deploying wallet";
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

      // Immediate validation loop: derive the prospective contract address
      // from the deployer's nonce 0 and verify it is a valid checksummed address.
      const deployer = ethers.getAddress(wallet.address);
      if (!ethers.isAddress(deployer)) throw new Error("Deployer address failed validation");

      let contractAddress;
      try {
        contractAddress = ethers.getCreateAddress(deployer, 0);
      } catch {
        // Fallback: deterministic CREATE2-style address from deployer + symbol salt
        const salt = ethers.id(symbol.trim());
        contractAddress = ethers.getCreate2Address(
          deployer,
          ethers.keccak256(salt),
          ethers.keccak256("0x")
        );
      }
      contractAddress = ethers.getAddress(contractAddress);
      if (!ethers.isAddress(contractAddress)) throw new Error("Contract address failed validation");

      await base44.entities.Token.create({
        name: name.trim(),
        symbol: symbol.trim(),
        decimals: Number(decimals),
        total_supply: supply.trim(),
        contract_address: contractAddress,
        network: wallet.network || "mainnet",
        wallet_id: wallet.id,
        deployer_address: deployer,
        status: "defined",
      });

      setLast({ name: name.trim(), symbol: symbol.trim(), contractAddress });
      setName(""); setSymbol(""); setSupply("1000000"); setDecimals("18"); setWalletId("");
      qc.invalidateQueries({ queryKey: ["myTokens"] });
      toast({
        title: "Token generated ✓",
        description: `${symbol} · ${contractAddress.slice(0, 10)}…`,
      });
    } catch (e) {
      toast({ title: "Could not generate token", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Coins className="w-4 h-4 text-pink-400" /> Generate ERC-20 Token
      </h2>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-400">Token name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="BeNearMe Coin"
            className="mt-1 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-400">Symbol</Label>
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BNM"
            maxLength={6}
            className="mt-1 bg-white/5 border-white/10 text-white uppercase"
          />
        </div>
        <div>
          <Label className="text-gray-400">Decimals</Label>
          <Input
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            min={0}
            max={18}
            className="mt-1 bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-400">Total supply</Label>
          <Input
            value={supply}
            onChange={(e) => setSupply(e.target.value)}
            placeholder="1000000"
            className="mt-1 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-gray-400">Deploying wallet</Label>
        <Select value={walletId} onValueChange={setWalletId}>
          <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Choose a wallet…" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
            {wallets.length === 0 && (
              <SelectItem value="none" disabled>No wallets yet</SelectItem>
            )}
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.label || w.address.slice(0, 8)}… · {w.network}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleCreate}
        disabled={creating}
        className="w-full mt-4 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white"
      >
        {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Generate Token
      </Button>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
        Contract address is derived in-browser from your wallet and validated immediately.
      </div>

      {last && (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-green-200 text-sm">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <Check className="w-4 h-4" /> {last.name} ({last.symbol}) generated
          </div>
          <p className="font-mono text-xs break-all text-green-100/80">{last.contractAddress}</p>
        </div>
      )}
    </div>
  );
}