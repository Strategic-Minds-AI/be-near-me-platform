import { useState } from "react";
import { Aperture, SlidersHorizontal } from "lucide-react";
import { BnmHeader, BnmPage } from "@/components/bnm/BnmChrome";

const filters = ["Original", "Clean", "Cinematic", "Vivid", "B&W"];

export default function BnmEffects() {
  const [selected, setSelected] = useState("Original");

  return (
    <BnmPage nav={false}>
      <BnmHeader title="Effects & Filters" back />
      <main className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-md flex-col px-4 pb-8 pt-4">
        <section className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-[#090d15]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(213,0,255,.10),transparent_42%)]" />
          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.035]">
              <Aperture className="h-12 w-12 text-[#6e7a92]" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-xl font-extrabold text-white">Preview unavailable</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#8d98ad]">
              Effects preview activates when camera media is available.
            </p>
          </div>
        </section>

        <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7f899f]">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const active = selected === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelected(filter)}
                className={
                  "w-[92px] shrink-0 rounded-[18px] border p-2 transition " +
                  (active ? "border-fuchsia-400/70 bg-fuchsia-500/10" : "border-white/10 bg-white/[0.035]")
                }
              >
                <span className="flex aspect-square items-center justify-center rounded-[14px] bg-[#121827] text-[#6c7890]">
                  <Aperture className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <span className={"mt-2 block text-xs font-bold " + (active ? "text-white" : "text-[#8d98ad]")}>{filter}</span>
              </button>
            );
          })}
        </div>
      </main>
    </BnmPage>
  );
}
