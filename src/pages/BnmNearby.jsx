import { useState } from "react";
import { Crosshair, MapPin, Navigation } from "lucide-react";
import { BnmEmptyState, BnmHeader, BnmPage } from "@/components/bnm/BnmChrome";

export default function BnmNearby() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Location services are not available in this browser.");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      () => {
        setStatus("enabled");
        setMessage("Location is enabled. Nearby results will appear when local content is available.");
      },
      (error) => {
        setStatus("error");
        setMessage(error?.message || "Location permission was not granted.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <BnmPage>
      <BnmHeader title="Nearby" brand />
      <main className="mx-auto max-w-md px-4 pt-4">
        <section className="relative min-h-[68dvh] overflow-hidden rounded-[30px] border border-white/10 bg-[#08101f]">
          <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(95,72,155,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(95,72,155,.12)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute left-[12%] top-[18%] h-40 w-56 rotate-[-14deg] rounded-full border border-fuchsia-500/10" />
          <div className="absolute bottom-[14%] right-[5%] h-52 w-72 rotate-[18deg] rounded-full border border-violet-500/10" />

          <div className="relative z-10">
            <BnmEmptyState
              Icon={status === "enabled" ? Navigation : MapPin}
              title={status === "enabled" ? "Location enabled" : "Discover what's near you"}
              description={message || "Enable location to use proximity discovery. Nearby people, businesses, and events only appear from real data."}
              action={
                status === "enabled" ? (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-[#b6bfd1]">
                    <Crosshair className="h-4 w-4 text-fuchsia-400" />
                    Waiting for real local content
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={enableLocation}
                    disabled={status === "loading"}
                    className="rounded-full bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff] px-6 py-3 text-sm font-extrabold text-white shadow-[0_0_30px_rgba(213,0,255,.24)] disabled:opacity-60"
                  >
                    {status === "loading" ? "Requesting location..." : "Enable Location"}
                  </button>
                )
              }
            />
          </div>
        </section>
      </main>
    </BnmPage>
  );
}
