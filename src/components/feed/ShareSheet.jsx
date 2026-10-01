import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Link2, Share2, Instagram, Music2, Loader2, Check, AlertCircle } from "lucide-react";

const PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp", color: "#25D366", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + " " + u)}` },
  { key: "x", label: "X", color: "#000000", href: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { key: "facebook", label: "Facebook", color: "#1877F2", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: "telegram", label: "Telegram", color: "#0088cc", href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { key: "reddit", label: "Reddit", color: "#FF4500", href: (u, t) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { key: "email", label: "Email", color: "#6b7280", href: (u, t) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(t + "\n" + u)}` },
  { key: "sms", label: "SMS", color: "#22c55e", href: (u, t) => `sms:?&body=${encodeURIComponent(t + " " + u)}` },
  { key: "native", label: "More", color: "#6366f1", href: null },
];

export default function ShareSheet({ open, onClose, url, title, videoId }) {
  const [copied, setCopied] = useState(false);
  const [igStatus, setIgStatus] = useState(null); // null | 'posting' | 'done' | 'error'
  const [igMsg, setIgMsg] = useState("");
  const text = title || "Check out this clip";

  const openShare = (href) => window.open(href, "_blank", "noopener,noreferrer");

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch {}
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handle = (p) => {
    if (p.key === "native") nativeShare();
    else openShare(p.href(url, text));
  };

  const shareInstagram = async (target) => {
    setIgStatus("posting");
    setIgMsg("");
    try {
      const res = await base44.functions.invoke("shareToInstagram", { videoId, target });
      setIgStatus("done");
      setIgMsg(res.data?.message || "Posted to Instagram!");
      setTimeout(() => { setIgStatus(null); setIgMsg(""); }, 2500);
    } catch (e) {
      setIgStatus("error");
      setIgMsg(e?.message || "Instagram not connected. Connect it in Settings.");
      setTimeout(() => { setIgStatus(null); setIgMsg(""); }, 3500);
    }
  };

  const shareTikTok = () => {
    window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="relative w-full max-w-md bg-[#161618] border-t border-white/10 rounded-t-3xl p-5 pb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-lg">Share to</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post to socials */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => shareInstagram("feed")}
                disabled={igStatus === "posting"}
                className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-600 to-amber-500 rounded-2xl p-3 text-white font-semibold text-sm disabled:opacity-60"
              >
                {igStatus === "posting" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Instagram className="w-5 h-5" />}
                Instagram
              </button>
              <button
                onClick={shareTikTok}
                className="flex items-center gap-3 bg-[#161618] border border-white/15 rounded-2xl p-3 text-white font-semibold text-sm"
              >
                <Music2 className="w-5 h-5" />
                TikTok
              </button>
            </div>

            {igStatus === "done" && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4">
                <Check className="w-4 h-4" /> {igMsg}
              </div>
            )}
            {igStatus === "error" && (
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" /> {igMsg}
              </div>
            )}

            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={nativeShare}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3"
              >
                <Share2 className="w-4 h-4" /> Share via apps
              </button>
            )}

            <div className="grid grid-cols-4 gap-3">
              {PLATFORMS.map((p) => (
                <button key={p.key} onClick={() => handle(p)} className="flex flex-col items-center gap-2">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: p.color }}>
                    {p.label[0]}
                  </span>
                  <span className="text-xs text-white/70">{p.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={copyLink}
              className="mt-5 w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <span className="flex items-center gap-2 text-white text-sm min-w-0">
                <Link2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{url}</span>
              </span>
              <span className={`text-sm font-semibold flex-shrink-0 ml-3 ${copied ? "text-emerald-400" : "text-pink-400"}`}>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}