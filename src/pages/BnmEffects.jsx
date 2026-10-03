import { useState } from "react";
import { Aperture, SlidersHorizontal } from "lucide-react";
import {
  BnmLockedScreen,
  Glass,
  Pill,
} from "@/components/bnm/LockedShell";

const filters = ["Original", "Clean", "Cinematic", "Vivid", "B&W"];

export default function BnmEffects() {
  const [selected, setSelected] = useState("Original");

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Effects</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Effects & Filters
          </h1>
          <p className="mt-1 text-sm text-[#8fa0c4]">
            Effects become available when camera media is active.
          </p>
        </Glass>

        <Glass className="mt-3 overflow-hidden p-3">
          <section className="relative grid min-h-[430px] place-items-center overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_50%_35%,rgba(139,82,255,.16),transparent_42%),#071226]">
            <div className="text-center">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#35517c] bg-[#0a1832]">
                <Aperture className="h-10 w-10 text-[#8d79d9]" />
              </div>
              <h2 className="mt-5 text-lg font-black text-white">
                Preview unavailable
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#8fa0c4]">
                Open the camera to preview filters on live media.
              </p>
            </div>
          </section>

          <div className="mt-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#8799bd]">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelected(filter)}
                className="shrink-0"
              >
                <Glass
                  className={
                    "w-[92px] p-2 " +
                    (selected === filter ? "border-[#8e66ff]" : "")
                  }
                >
                  <span className="grid aspect-square place-items-center rounded-[12px] bg-[#10213e]">
                    <Aperture className="h-6 w-6 text-[#8d79d9]" />
                  </span>
                  <span className="mt-2 block text-[10px] font-black text-white">
                    {filter}
                  </span>
                </Glass>
              </button>
            ))}
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
