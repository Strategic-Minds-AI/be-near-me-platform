import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Radio, Users } from "lucide-react";
import { bnmData } from "@/services/bnmData";
import {
  Avatar,
  BnmLockedScreen,
  EmptyState,
  Glass,
  Pill,
  asItems,
  formatCount,
} from "@/components/bnm/LockedShell";

export default function BnmLockedLive() {
  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["bnmLiveStreams"],
    queryFn: async () =>
      asItems(
        await bnmData.entities.LiveStream.filter(
          { status: "live", visibility: "public" },
          { sort: "-viewers_current", limit: 50 }
        )
      ),
  });

  return (
    <BnmLockedScreen activeSection="Live">
      <section className="px-3 pt-3">
        <Glass className="overflow-hidden p-4">
          <div className="flex items-center gap-2">
            <Pill active>
              <Radio className="h-3.5 w-3.5" />
              Live
            </Pill>
            <span className="text-[11px] text-[#8fa0c4]">
              Real public streams only
            </span>
          </div>
          <h1 className="mt-4 text-[26px] font-black tracking-[-0.04em]">
            Live Near You
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8fa0c4]">
            Watch active creators and community moments as they happen.
          </p>
        </Glass>
      </section>

      <section className="px-3 pb-4 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-[20px] border border-[#263e68] bg-[#08162b]"
              />
            ))}
          </div>
        ) : streams.length ? (
          <div className="grid grid-cols-2 gap-3">
            {streams.map((stream) => (
              <Link
                key={stream.id}
                to={"/live-watch?id=" + encodeURIComponent(stream.id)}
                className="min-w-0"
              >
                <Glass className="overflow-hidden">
                  <div className="relative aspect-[3/4] bg-[#071226]">
                    {stream.thumbnail_url ? (
                      <img
                        src={stream.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(255,57,183,.2),transparent_38%),linear-gradient(135deg,#102850,#24143c)]">
                        <Radio className="h-10 w-10 text-[#ff4fb8]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020812] via-transparent to-transparent" />
                    <div className="absolute left-2 top-2">
                      <Pill active className="px-2 py-1 text-[9px]">
                        LIVE
                      </Pill>
                    </div>
                    <div className="absolute inset-x-2 bottom-2">
                      <p className="line-clamp-2 text-[12px] font-black text-white">
                        {stream.title || "Live stream"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar
                          src={stream.channel_avatar}
                          label={stream.channel_name || "BNM"}
                          size={28}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold text-white">
                            {stream.channel_name || "Creator"}
                          </p>
                          <p className="flex items-center gap-1 text-[9px] text-[#91a2c5]">
                            <Users className="h-3 w-3" />
                            {formatCount(stream.viewers_current || 0)} watching
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Glass>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Radio}
            title="No live streams right now"
            body="When a real public stream starts, it will appear here automatically."
          />
        )}
      </section>
    </BnmLockedScreen>
  );
}
