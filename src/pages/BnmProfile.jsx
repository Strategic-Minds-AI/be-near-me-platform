import { Link } from "react-router-dom";
import { Grid3X3, Heart, LockKeyhole, PlaySquare, User } from "lucide-react";
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

export default function BnmProfile() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["bnmCurrentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ["bnmProfileChannel", user?.email],
    queryFn: async () => {
      const result = await base44.entities.Channel.filter({ created_by: user.email }, { limit: 1 });
      return (result?.items || result || [])[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["bnmProfileVideos", channel?.id],
    queryFn: async () => {
      const result = await base44.entities.Video.filter({ channel_id: channel.id }, { sort: "-created_date", limit: 60 });
      return result?.items || result || [];
    },
    enabled: !!channel?.id,
  });

  const loading = userLoading || channelLoading;

  return (
    <BnmPage>
      <BnmHeader title="Profile" brand />
      <main className="mx-auto max-w-md px-4 pt-5">
        {loading ? (
          <div className="flex min-h-[65dvh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-fuchsia-500" />
          </div>
        ) : !user ? (
          <BnmEmptyState
            Icon={LockKeyhole}
            title="Sign in to view your profile"
            description="Your profile, videos, and creator activity will appear here."
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
        ) : (
          <>
            <section className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-fuchsia-500/65 bg-[#0b101a] shadow-[0_0_35px_rgba(213,0,255,.12)]">
                {channel?.avatar_url ? (
                  <img src={channel.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-[#748099]" strokeWidth={1.5} />
                )}
              </div>

              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
                {channel?.name || user.full_name || "Your profile"}
              </h2>
              {channel?.handle ? <p className="mt-1 text-sm text-[#929db2]">@{channel.handle}</p> : null}

              <div className="mt-6 grid w-full grid-cols-3 divide-x divide-white/10">
                <Stat value={channel?.subscriptions_count || 0} label="Following" />
                <Stat value={channel?.subscribers_count || 0} label="Followers" />
                <Stat value={channel?.total_likes || 0} label="Likes" />
              </div>

              <Link
                to={channel ? "/Channel?id=" + encodeURIComponent(channel.id) : "/CreateChannel"}
                className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-sm font-extrabold text-white transition hover:bg-white/[0.09]"
              >
                {channel ? "View Profile" : "Create Profile"}
              </Link>

              {channel?.description ? <p className="mt-5 text-sm leading-6 text-[#a5afc2]">{channel.description}</p> : null}
            </section>

            <div className="mt-8 grid grid-cols-4 border-b border-white/10">
              {[Grid3X3, PlaySquare, Heart, LockKeyhole].map((Icon, index) => (
                <div key={index} className="relative flex h-14 items-center justify-center text-[#7e899f]">
                  <Icon className="h-5 w-5" />
                  {index === 0 ? <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-[#ff008f] to-[#7a38ff]" /> : null}
                </div>
              ))}
            </div>

            {videos.length ? (
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {videos.map((video) => (
                  <Link key={video.id} to={"/Watch?v=" + encodeURIComponent(video.id)} className="aspect-[3/4] overflow-hidden rounded-xl bg-[#0d121d]">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <PlaySquare className="h-7 w-7 text-[#657189]" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <BnmEmptyState Icon={PlaySquare} title="No videos yet" description="Tap Create to record or upload your first video." />
            )}
          </>
        )}
      </main>
    </BnmPage>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-2">
      <div className="text-xl font-extrabold text-white">{Number(value || 0).toLocaleString()}</div>
      <div className="mt-1 text-xs text-[#7f8aa0]">{label}</div>
    </div>
  );
}
