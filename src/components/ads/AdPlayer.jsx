import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Volume2, VolumeX, Info } from "lucide-react";

export default function AdPlayer({ 
  ad, 
  onAdComplete, 
  onAdSkip,
  onAdClick 
}) {
  const videoRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(ad?.skip_after || 5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    if (!ad) {
      onAdComplete?.();
      return;
    }

    // Track impression
    if (!hasTrackedImpression) {
      base44.entities.AdCampaign.update(ad.id, {
        impressions: (ad.impressions || 0) + 1,
        spent_cents: (ad.spent_cents || 0) + Math.round((ad.cpm_cents || 500) / 1000),
      });
      setHasTrackedImpression(true);
    }

    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ad, hasTrackedImpression]);

  const handleAdClick = () => {
    if (ad?.click_url) {
      // Track click
      base44.entities.AdCampaign.update(ad.id, {
        clicks: (ad.clicks || 0) + 1,
      });
      window.open(ad.click_url, "_blank");
      onAdClick?.();
    }
  };

  const handleSkip = () => {
    onAdSkip?.();
  };

  const handleComplete = () => {
    // Track completion
    base44.entities.AdCampaign.update(ad.id, {
      completions: (ad.completions || 0) + 1,
    });
    onAdComplete?.();
  };

  if (!ad) return null;

  return (
    <div className="absolute inset-0 bg-black z-50">
      {/* Ad Video */}
      {ad.media_url ? (
        <video
          ref={videoRef}
          src={ad.media_url}
          autoPlay
          muted={isMuted}
          onEnded={handleComplete}
          className="w-full h-full object-contain cursor-pointer"
          onClick={handleAdClick}
        />
      ) : (
        <div 
          className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer"
          onClick={handleAdClick}
        >
          <div className="text-center text-white p-8">
            <p className="text-2xl font-bold mb-2">{ad.name}</p>
            <p className="text-white/80">Click to learn more</p>
          </div>
        </div>
      )}

      {/* Ad Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
          AD
        </div>
        <div className="px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1">
          <Info className="w-3 h-3" />
          {ad.advertiser_name || "Sponsored"}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {ad.click_url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdClick}
              className="text-white hover:bg-white/20 h-8"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          )}
        </div>

        <div>
          {canSkip ? (
            <Button
              onClick={handleSkip}
              className="bg-white/20 hover:bg-white/30 text-white h-8"
            >
              Skip Ad
            </Button>
          ) : ad.skippable ? (
            <div className="px-4 py-2 bg-black/50 text-white text-sm rounded">
              Skip in {timeRemaining}s
            </div>
          ) : (
            <div className="px-4 py-2 bg-black/50 text-white text-sm rounded">
              Ad • {Math.ceil((ad.duration || 30) - (videoRef.current?.currentTime || 0))}s
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-yellow-500 transition-all duration-200"
          style={{ 
            width: `${((videoRef.current?.currentTime || 0) / (ad.duration || 30)) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}