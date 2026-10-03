import { Link } from "react-router-dom";
import { MapPin, Play, Sparkles, Users } from "lucide-react";
import {
  BnmLockedScreen,
  Glass,
  Pill,
} from "@/components/bnm/LockedShell";

export default function About() {
  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>About</Pill>
          <h1 className="mt-3 text-[26px] font-black tracking-[-0.04em]">
            About Be Near Me
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#9aacca]">
            A mobile-first social video and local discovery experience built around people, places, creators, and positive community activity near you.
          </p>
        </Glass>

        <div className="mt-3 grid gap-2">
          <Info
            icon={Play}
            title="Create & Watch"
            body="Record, upload, discover, and watch short-form creator video in a fast mobile feed."
          />
          <Info
            icon={MapPin}
            title="Discover Nearby"
            body="Explore verified local opportunities and community activity without fabricating location data."
          />
          <Info
            icon={Users}
            title="Creators & Community"
            body="Follow creators, interact with real posts, and participate in community challenges."
          />
          <Info
            icon={Sparkles}
            title="Helpful AI"
            body="Use the AI Coach for ideas and guidance around local, positive actions when those features are available."
          />
        </div>

        <div className="pb-4 pt-4 text-center">
          <Link to="/home" className="text-sm font-black text-[#57c6ff]">
            Return to Be Near Me
          </Link>
        </div>
      </div>
    </BnmLockedScreen>
  );
}

function Info({ icon: Icon, title, body }) {
  return (
    <Glass className="p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#10213e]">
          <Icon className="h-5 w-5 text-[#a38bff]" />
        </span>
        <div>
          <h2 className="text-sm font-black text-white">{title}</h2>
          <p className="mt-1 text-[12px] leading-5 text-[#91a2c2]">{body}</p>
        </div>
      </div>
    </Glass>
  );
}
