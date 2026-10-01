import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  Play, 
  Download, 
  Volume2, 
  Sparkles,
  X
} from "lucide-react";

export default function PremiumBanner({ onClose }) {
  const features = [
    { icon: Play, text: "Ad-free videos" },
    { icon: Download, text: "Download videos" },
    { icon: Volume2, text: "Background play" },
    { icon: Sparkles, text: "Exclusive content" },
  ];

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-6 md:p-8 overflow-hidden">
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">Be Near Me Premium</h3>
          </div>
          
          <p className="text-white/90 mb-4">
            Get the best experience with ad-free videos, offline downloads, and more.
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            {features.map((feature) => (
              <div key={feature.text} className="flex items-center gap-2 text-white/90">
                <feature.icon className="w-4 h-4" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Settings")}>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-6">
                Try Free for 1 Month
              </Button>
            </Link>
            <span className="text-white/70 text-sm">
              Then $11.99/month
            </span>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="w-48 h-48 relative">
            <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-white/20 rounded-full animate-pulse delay-100" />
            <div className="absolute inset-8 bg-white/30 rounded-full flex items-center justify-center">
              <Crown className="w-16 h-16 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}