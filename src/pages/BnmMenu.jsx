import { Link } from "react-router-dom";
import {
  ChevronRight,
  CircleHelp,
  Heart,
  MapPin,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Video,
} from "lucide-react";
import {
  BnmLockedScreen,
  Glass,
  Pill,
} from "@/components/bnm/LockedShell";

const items = [
  { label: "My Profile", to: "/profile", Icon: User },
  { label: "Profile Settings", to: "/settings", Icon: Settings },
  { label: "Creator Studio", to: "/creator-studio", Icon: Sparkles },
  { label: "Upload Video", to: "/upload", Icon: Video },
  { label: "Nearby", to: "/nearby", Icon: MapPin },
  { label: "Rewards", to: "/rewards", Icon: Heart },
  { label: "Video Tracker", to: "/tracker", Icon: TrendingUp },
  { label: "Help & Support", to: "/Contact", Icon: CircleHelp },
];

export default function BnmMenu() {
  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Menu</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Be Near Me
          </h1>
          <p className="mt-1 text-sm text-[#8fa0c4]">
            Your profile, creator tools, local discovery, and support.
          </p>
        </Glass>

        <Glass className="mt-3 overflow-hidden">
          <nav>
            {items.map(({ label, to, Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 border-b border-[#20375b] px-4 py-4 last:border-b-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#10213e]">
                  <Icon className="h-5 w-5 text-[#a38bff]" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-black text-white">
                  {label}
                </span>
                <ChevronRight className="h-5 w-5 text-[#7184a8]" />
              </Link>
            ))}
          </nav>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
