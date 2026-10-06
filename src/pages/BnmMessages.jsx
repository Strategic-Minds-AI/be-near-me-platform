import { useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  Pill,
} from "@/components/bnm/LockedShell";

export default function BnmMessages() {
  const [query, setQuery] = useState("");

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Messages</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Conversations
          </h1>
          <p className="mt-1 text-sm text-[#8fa0c4]">
            Direct conversations will appear here when messaging data is available.
          </p>
        </Glass>

        <Glass className="mt-3 p-3">
          <div className="flex items-center gap-2 rounded-full border border-[#35517c] bg-[#0a1832] px-3">
            <Search className="h-4 w-4 text-[#7184a8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 100))}
              placeholder="Search messages"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />
          </div>
        </Glass>

        <div className="mt-3">
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            body="Direct conversations will appear here when real messaging data is available."
          />
        </div>
      </div>
    </BnmLockedScreen>
  );
}
