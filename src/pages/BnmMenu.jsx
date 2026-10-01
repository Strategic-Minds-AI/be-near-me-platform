import { Link } from "react-router-dom";
import { ChevronRight, CircleHelp, Heart, MapPin, Settings, Sparkles, User, Video } from "lucide-react";
import BnmLogoMark from "@/components/bnm/BnmLogoMark";

const items = [
  { label: "My Profile", to: "/profile", Icon: User },
  { label: "Settings", to: "/Settings", Icon: Settings },
  { label: "Saved Videos", to: "/Playlists", Icon: Video },
  { label: "Liked Videos", to: "/LikedVideos", Icon: Heart },
  { label: "Local Business", to: "/nearby", Icon: MapPin },
  { label: "Creator Tools", to: "/CreatorStudio", Icon: Sparkles },
  { label: "Help & Support", to: "/Contact", Icon: CircleHelp },
];

export default function BnmMenu() {
  return (
    <div className="min-h-[100dvh] bg-[#03050a] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(213,0,255,.10),transparent_36%)]" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md">
        <Link to="/home" className="flex w-[22%] items-start justify-center pt-8 text-xs font-bold text-[#707b91]" aria-label="Close menu">
          Close
        </Link>
        <aside className="min-h-[100dvh] flex-1 border-l border-white/10 bg-[#0a101b]/95 px-5 pb-10 pt-8 shadow-[-24px_0_80px_rgba(0,0,0,.35)] backdrop-blur-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-7">
            <BnmLogoMark className="h-14 w-12" />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">B Near Me</h1>
              <p className="mt-1 text-xs text-[#7f899f]">People · Places · Moments</p>
            </div>
          </div>
          <nav className="mt-3">
            {items.map(({ label, to, Icon }) => (
              <Link key={label} to={to} className="flex items-center gap-4 border-b border-white/[0.07] py-5 text-white transition hover:bg-white/[0.025]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]">
                  <Icon className="h-5 w-5 text-[#d6dbea]" />
                </span>
                <span className="flex-1 text-[15px] font-extrabold">{label}</span>
                <ChevronRight className="h-5 w-5 text-[#68748a]" />
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
