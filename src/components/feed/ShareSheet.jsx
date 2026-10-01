import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Share2 } from "lucide-react";

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

export default function ShareSheet({ open, onClose, url, title }) {
  const [copied, setCopied] = useState(false);
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
                  <span
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: p.color }}
                  >
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