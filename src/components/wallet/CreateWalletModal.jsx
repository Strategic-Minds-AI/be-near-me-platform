import React, { useState } from "react";
import { Copy, Check, Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CreateWalletModal({ data, onClose }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyMnemonic = async () => {
    await navigator.clipboard.writeText(data.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-pink-500" /> Save your recovery phrase
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Shown <span className="text-white font-semibold">once</span>. We never store it. Save it offline — you'll need it to recover this wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2 text-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Anyone with this phrase controls your funds. Never share it with anyone.</span>
        </div>

        <div className="rounded-xl bg-black/40 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">12-word recovery phrase</span>
            <Button size="sm" variant="ghost" className="text-pink-400 hover:bg-white/10" onClick={() => setRevealed((v) => !v)}>
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className={`font-mono text-sm break-words select-all leading-relaxed ${revealed ? "" : "blur-sm"}`}>
            {data.mnemonic}
          </p>
          <Button size="sm" variant="outline" className="mt-3 border-white/20 text-white hover:bg-white/10" onClick={copyMnemonic}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />} Copy phrase
          </Button>
        </div>

        <div className="text-sm text-gray-400">
          Wallet address: <span className="font-mono text-pink-400 break-all">{data.address}</span>
        </div>

        <DialogFooter className="gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300 mr-auto">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="accent-pink-500 w-4 h-4" />
            I understand this phrase can't be recovered
          </label>
          <Button disabled={!saved} onClick={onClose} className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white">
            I've saved it securely
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}