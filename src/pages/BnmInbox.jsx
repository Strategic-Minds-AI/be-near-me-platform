import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BnmEmptyState, BnmHeader, BnmPage } from "@/components/bnm/BnmChrome";

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

const tabs = ["All", "Followers", "Likes", "Comments", "Mentions"];

export default function BnmInbox() {
  const [tab, setTab] = useState("All");
  const { data: user } = useQuery({ queryKey: ["bnmInboxUser"], queryFn: safeCurrentUser });
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["bnmInbox", user?.email],
    queryFn: async () => {
      const result = await base44.entities.Notification.filter({ created_by: user.email }, { sort: "-created_date", limit: 100 });
      return result?.items || result || [];
    },
    enabled: !!user?.email,
  });

  const filtered = useMemo(() => {
    if (tab === "All") return notifications;
    const map = {
      Followers: ["subscription"],
      Likes: ["like"],
      Comments: ["comment_reply"],
      Mentions: ["mention"],
    };
    return notifications.filter((item) => (map[tab] || []).includes(item.type));
  }, [notifications, tab]);

  return (
    <BnmPage>
      <BnmHeader
        title="Inbox"
        brand
        right={
          <Link to="/messages" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.045]" aria-label="Messages">
            <MessageCircle className="h-5 w-5" />
          </Link>
        }
      />
      <main className="mx-auto max-w-md px-4 pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-4">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold " +
                (tab === item
                  ? "border-fuchsia-400/50 bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff] text-white"
                  : "border-white/10 bg-white/[0.045] text-[#9ba6bb]")
              }
            >
              {item}
            </button>
          ))}
        </div>

        {!user ? (
          <BnmEmptyState
            Icon={Bell}
            title="Sign in to see your inbox"
            description="Real notifications from your account will appear here."
            action={
              <button
                type="button"
                onClick={() => base44.auth.redirectToLogin()}
                className="rounded-full bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff] px-6 py-3 text-sm font-extrabold text-white"
              >
                Sign In
              </button>
            }
          />
        ) : isLoading ? (
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="space-y-2">
            {filtered.map((item) => (
              <article key={item.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <NotificationIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  {item.source_channel_name ? <p className="truncate text-sm font-extrabold text-white">{item.source_channel_name}</p> : null}
                  {item.message ? <p className="mt-0.5 text-sm leading-5 text-[#a3aec1]">{item.message}</p> : null}
                  {item.created_date ? <p className="mt-1 text-[11px] text-[#68748a]">{new Date(item.created_date).toLocaleString()}</p> : null}
                </div>
                {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="h-14 w-14 rounded-xl object-cover" /> : null}
              </article>
            ))}
          </div>
        ) : (
          <BnmEmptyState Icon={Bell} title="No activity yet" description="Notifications and activity will appear here when real account activity exists." />
        )}
      </main>
    </BnmPage>
  );
}

function NotificationIcon({ type }) {
  const Icon = type === "subscription" ? UserPlus : type === "like" ? Heart : type === "comment_reply" || type === "mention" ? MessageCircle : Bell;
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10">
      <Icon className="h-5 w-5 text-fuchsia-300" />
    </div>
  );
}
