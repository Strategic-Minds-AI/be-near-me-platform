import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import BnmFeed from "@/components/bnm/BnmFeed";
import { BnmBottomNav } from "@/components/bnm/BnmChrome";

export default function BnmHome() {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black text-white">
      <BnmFeed />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/75 via-black/20 to-transparent pb-12"
        style={{ paddingTop: "max(env(safe-area-inset-top), 10px)" }}
      >
        <div className="pointer-events-auto relative mx-auto flex h-12 max-w-sm items-center justify-center gap-8 text-sm font-semibold">
          <Link to="/menu" className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Link>
          <Link to="/Subscriptions" className="text-white/55 transition hover:text-white">Following</Link>
          <span className="relative text-white">
            For You
            <span className="absolute -bottom-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff]" />
          </span>
          <Link to="/nearby" className="text-white/55 transition hover:text-white">Nearby</Link>
        </div>
      </div>
      <BnmBottomNav />
    </div>
  );
}
