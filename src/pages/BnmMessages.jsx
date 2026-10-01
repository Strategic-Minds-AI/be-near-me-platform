import { useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { BnmEmptyState, BnmHeader, BnmPage, BnmSearchField } from "@/components/bnm/BnmChrome";

export default function BnmMessages() {
  const [query, setQuery] = useState("");
  return (
    <BnmPage>
      <BnmHeader
        title="Messages"
        back
        right={
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.045]" aria-label="New message">
            <Plus className="h-5 w-5" />
          </button>
        }
      />
      <main className="mx-auto max-w-md px-4 pt-4">
        <BnmSearchField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages..." />
        <BnmEmptyState
          Icon={MessageCircle}
          title="No messages yet"
          description="Direct conversations will appear here when messaging data is available."
        />
      </main>
    </BnmPage>
  );
}
