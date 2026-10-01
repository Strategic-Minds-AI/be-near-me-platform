import { Link } from "react-router-dom";
import TikTokFeed from "@/components/feed/TikTokFeed";
import { BnmBottomNav } from "@/components/bnm/BnmChrome";

export default function BnmHome() {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black text-white">
      <TikTokFeed showTrending={false} emptyVariant="bnm" />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/75 via-black/20 to-transparent pb-12"
        style={{ paddingTop: "max(env(safe-area-inset-top), 10px)" }}
      >
        <div className="pointer-events-auto mx-auto flex h-12 max-w-sm items-center justify-center gap-8 text-sm font-semibold">
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
