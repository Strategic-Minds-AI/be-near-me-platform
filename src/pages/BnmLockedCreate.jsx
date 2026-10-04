import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Aperture,
  Bot,
  Clapperboard,
  Gift,
  Hash,
  LayoutDashboard,
  MapPin,
  MessageCircleHeart,
  Radio,
  Rocket,
  Sparkles,
  Target,
  Upload,
  UserPlus,
  Video,
  Wand2,
} from "lucide-react";
import Camera from "@/pages/Camera";
import { BnmLockedScreen, Glass, Pill } from "@/components/bnm/LockedShell";

const TAGS = ["Kindness", "Community", "Environment", "Animals", "People"];

const ACTION_GROUPS = [
  {
    title: "Create Content",
    items: [
      { id: "record", label: "Record Video", detail: "Use the camera now", icon: Video, local: true },
      { id: "upload", label: "Upload Video", detail: "Publish an existing clip", icon: Upload, to: "/upload" },
      { id: "ai-video", label: "AI Video", detail: "Generate a vertical clip", icon: Clapperboard, to: "/ai-video-studio" },
      { id: "picture-video", label: "Picture to Video", detail: "Turn photos into video", icon: Wand2, to: "/picture-to-video" },
      { id: "viral-video", label: "Viral Creator", detail: "Build from winning patterns", icon: Rocket, to: "/viral-video-creator" },
      { id: "effects", label: "Effects", detail: "Filters and camera effects", icon: Aperture, to: "/effects" },
    ],
  },
  {
    title: "Community Activities",
    items: [
      { id: "challenge", label: "Create Challenge", detail: "Start a kindness dare", icon: Target, to: "/dares" },
      { id: "truth", label: "Share a Truth", detail: "Create a truth prompt", icon: MessageCircleHeart, to: "/truths" },
      { id: "live", label: "Go Live", detail: "Set up a live stream", icon: Radio, to: "/studio-live" },
      { id: "nearby", label: "Nearby", detail: "See activity around you", icon: MapPin, to: "/nearby" },
    ],
  },
  {
    title: "Creator Tools",
    items: [
      { id: "channel", label: "Create Channel", detail: "Set up your creator identity", icon: UserPlus, to: "/create-channel" },
      { id: "studio", label: "Creator Studio", detail: "Manage creator activity", icon: LayoutDashboard, to: "/creator-studio" },
      { id: "coach", label: "AI Coach", detail: "Get help creating", icon: Bot, to: "/ai-coach" },
      { id: "rewards", label: "Rewards", detail: "View reward activity", icon: Gift, to: "/rewards" },
      { id: "tracker", label: "Activity Tracker", detail: "Track your progress", icon: Activity, to: "/tracker" },
    ],
  },
];

function ActionCard({ item, onLocal }) {
  const Icon = item.icon;
  const body = (
    <Glass className="h-full p-3 transition-transform active:scale-[0.98]">
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-[#31c8ff] via-[#7b5cff] to-[#ff3cac] shadow-[0_0_18px_rgba(125,82,255,.2)]">
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-black leading-4 text-white">{item.label}</div>
          <div className="mt-0.5 text-[8px] leading-3 text-[#8fa2c3]">{item.detail}</div>
        </div>
      </div>
    </Glass>
  );

  if (item.local) {
    return (
      <button type="button" onClick={() => onLocal(item.id)} className="text-left">
        {body}
      </button>
    );
  }

  return (
    <Link to={item.to} className="block">
      {body}
    </Link>
  );
}

export default function BnmLockedCreate() {
  const [mode, setMode] = useState("menu");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState(["Kindness"]);

  const toggleTag = (tag) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag].slice(0, 4)
    );
  };

  if (mode === "record") {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-2 pt-1">
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="mb-2 rounded-full border border-[#344e78] bg-[#0a1830] px-3 py-2 text-[10px] font-black text-white"
          >
            ← All Create Options
          </button>

          <div className="overflow-hidden rounded-[22px] border border-[#263f68] bg-black">
            <Camera embedded caption={caption} contentTags={tags} />
          </div>

          <Glass className="mt-2 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ff4fb8]" />
                <h2 className="text-[12px] font-black">Kindness Stickers & Topics</h2>
              </div>
              <span className="text-[8px] text-[#8295b8]">{tags.length}/4 topics</span>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {TAGS.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}>
                  <Pill active={tags.includes(tag)}>#{tag}</Pill>
                </button>
              ))}
            </div>
          </Glass>

          <div className="mt-2 flex items-start gap-2 rounded-[17px] border border-[#394f78] bg-[#0a1830] p-3">
            <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#32c8ff] via-[#8755ff] to-[#ff3cac]">
              <Hash className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value.slice(0, 220))}
                placeholder="Add a kind caption…"
                rows={2}
                className="w-full resize-none bg-transparent text-[11px] leading-4 text-white outline-none placeholder:text-[#7e91b5]"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-[8px] text-[#8fa2c3]">
                  <MapPin className="h-3 w-3" />
                  <span>No location attached</span>
                </div>
                <span className="text-[8px] text-[#7083a6]">{caption.length}/220</span>
              </div>
            </div>
          </div>

          <p className="px-2 pb-3 pt-2 text-center text-[8px] leading-4 text-[#7185aa]">
            Record, review, and post with the camera controls above. Location is never added unless the creator explicitly chooses it.
          </p>
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-3 pb-4 pt-3">
        <Glass className="overflow-hidden p-4">
          <Pill active>
            <Sparkles className="h-3.5 w-3.5" />
            Create
          </Pill>
          <h1 className="mt-3 text-[27px] font-black tracking-[-0.045em]">
            What do you want to make?
          </h1>
          <p className="mt-1 text-[11px] leading-5 text-[#93a5c5]">
            The center Create button is the full Be Near Me action hub — content,
            challenges, live activity, AI creation, and creator tools in one place.
          </p>
        </Glass>

        {ACTION_GROUPS.map((group) => (
          <section key={group.title} className="mt-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#aebbd3]">
                {group.title}
              </h2>
              <span className="text-[8px] text-[#7184a8]">{group.items.length} options</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((item) => (
                <ActionCard key={item.id} item={item} onLocal={setMode} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </BnmLockedScreen>
  );
}
