import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Smartphone, MousePointerClick } from "lucide-react";

const VISUAL = [
  "Full-screen vertical video fills the viewport — no grids or category bars over it",
  "Right-side action rail: profile, like, comment, save, share",
  "Bottom-left creator handle, caption, and spinning music disc",
  "Smooth snap-scroll — one video per screen, edge to edge",
  "Dark, immersive chrome that gets out of the way",
];

const OPERATIONAL = [
  "Tap video to play / pause; autoplay only when in view",
  "Swipe up / down to move between videos with momentum",
  "Like with the heart (live count); comment count live",
  "Follow the creator and open the full video from the rail",
  "Upload flow produces a vertical clip ready for the feed",
];

function Section({ icon: Icon, title, items }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-pink-400" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-white/80">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Benchmark() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 text-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center font-black text-black">TT</div>
        <div>
          <h1 className="text-2xl font-bold">Benchmark: TikTok</h1>
          <p className="text-sm text-white/60">The target for B Near Me's feed — visually and operationally.</p>
        </div>
      </div>

      <p className="text-white/80 mt-4 mb-8">
        This is what people see. Every change to the feed is measured against TikTok's full-screen, frictionless vertical experience.
      </p>

      <Section icon={Smartphone} title="Visual parity" items={VISUAL} />
      <Section icon={MousePointerClick} title="Operational parity" items={OPERATIONAL} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={createPageUrl("Home")} className="px-4 py-2 rounded-full bg-white text-black font-semibold text-sm">Open the feed</Link>
        <Link to={createPageUrl("Upload")} className="px-4 py-2 rounded-full bg-white/10 text-white font-semibold text-sm">Upload a clip</Link>
      </div>
    </div>
  );
}