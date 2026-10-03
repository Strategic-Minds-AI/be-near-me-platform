import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  GradientButton,
  Pill,
  asItems,
} from "@/components/bnm/LockedShell";

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
  const { data: user } = useQuery({
    queryKey: ["bnmInboxUser"],
    queryFn: safeCurrentUser,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["bnmInbox", user?.email],
    queryFn: async () =>
      asItems(
        await base44.entities.Notification.filter(
          { created_by: user.email },
          { sort: "-created_date", limit: 100 }
        )
      ),
    enabled: Boolean(user?.email),
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
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Pill active>Inbox</Pill>
              <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
                Activity
              </h1>
            </div>
            <Link
              to="/messages"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#35517c] bg-[#0a1832]"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </Glass>

        <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)}>
              <Pill active={tab === item}>{item}</Pill>
            </button>
          ))}
        </div>

        {!user ? (
          <div className="mt-3">
            <EmptyState
              icon={Bell}
              title="Sign in to see your inbox"
              body="Real account notifications will appear here."
            />
            <div className="mt-4 text-center">
              <GradientButton
                type="button"
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
              >
                Sign In
              </GradientButton>
            </div>
          </div>
        ) : isLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-[18px] border border-[#263e68] bg-[#08162b]"
              />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="mt-3 space-y-2">
            {filtered.map((item) => (
              <Glass key={item.id} className="flex gap-3 p-3">
                <NotificationIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  {item.source_channel_name ? (
                    <p className="truncate text-sm font-black text-white">
                      {item.source_channel_name}
                    </p>
                  ) : null}
                  {item.message ? (
                    <p className="mt-0.5 text-[12px] leading-5 text-[#a3aec1]">
                      {item.message}
                    </p>
                  ) : null}
                  {item.created_date ? (
                    <p className="mt-1 text-[10px] text-[#687d9f]">
                      {new Date(item.created_date).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="h-14 w-14 rounded-[12px] object-cover"
                  />
                ) : null}
              </Glass>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon={Bell}
              title="No activity yet"
              body="Notifications will appear here when real account activity exists."
            />
          </div>
        )}
      </div>
    </BnmLockedScreen>
  );
}

function NotificationIcon({ type }) {
  const Icon =
    type === "subscription"
      ? UserPlus
      : type === "like"
        ? Heart
        : type === "comment_reply" || type === "mention"
          ? MessageCircle
          : Bell;

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#26c8ff]/20 via-[#8f54ff]/20 to-[#ff38aa]/20">
      <Icon className="h-5 w-5 text-[#c38aff]" />
    </div>
  );
}
