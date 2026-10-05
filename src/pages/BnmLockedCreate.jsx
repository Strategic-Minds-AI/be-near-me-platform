import { useState } from "react";
import Camera from "@/pages/Camera";
import { BnmLockedScreen, Glass, Pill } from "@/components/bnm/LockedShell";
import TemplateGallery100 from "@/components/bnm/TemplateGallery100";
import AiCaptionInput from "@/components/bnm/AiCaptionInput";
import { BnmHashIcon, BnmMapPinIcon, BnmSparkleIcon } from "@/components/bnm/BnmIcons";

const TAGS = ["Kindness","Community","Environment","Animals","People"];

export default function BnmLockedCreate() {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState(["Kindness"]);

  const toggleTag = (tag) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0,4));
  };

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-2 pt-1">
        <div className="overflow-hidden rounded-[22px] border border-[#263f68] bg-black">
          <Camera embedded caption={caption} contentTags={tags} />
        </div>

        <Glass className="mt-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BnmSparkleIcon size={16} /><h2 className="text-[12px] font-black">Kindness Stickers & Topics</h2></div>
            <span className="text-[8px] text-[#8295b8]">{tags.length}/4 topics</span>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {TAGS.map((tag)=>(
              <button key={tag} onClick={()=>toggleTag(tag)}>
                <Pill active={tags.includes(tag)}>#{tag}</Pill>
              </button>
            ))}
          </div>
        </Glass>

        <div className="mt-2 flex items-start gap-2 rounded-[17px] border border-[#394f78] bg-[#0a1830] p-3">
          <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#32c8ff] via-[#8755ff] to-[#ff3cac]"><BnmHashIcon size={14} /></div>
          <div className="min-w-0 flex-1">
            <AiCaptionInput
              value={caption}
              onChange={setCaption}
              placeholder="Add a kind caption…"
              maxLength={220}
              tags={tags}
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5 text-[8px] text-[#8fa2c3]"><BnmMapPinIcon size={12} /><span>No location attached</span></div>
              <span className="text-[8px] text-[#7083a6]">{caption.length}/220</span>
            </div>
          </div>
        </div>

        <p className="px-2 pb-3 pt-2 text-center text-[8px] leading-4 text-[#7185aa]">
          Record, review, and post with the camera controls above. Location is never added unless the creator explicitly chooses it in a future verified location flow.
        </p>

        {/* 100 Viral Templates Gallery */}
        <div id="bnm-templates">
          <TemplateGallery100 />
        </div>
      </div>
    </BnmLockedScreen>
  );
}