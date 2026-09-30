import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Video, 
  BarChart3, 
  DollarSign, 
  MessageSquare, 
  Settings,
  Radio,
  Sparkles,
  Users,
  Copyright,
  ChevronLeft,
  Scissors
} from "lucide-react";

import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", page: "CreatorStudio" },
  { icon: Video, label: "Content", page: "StudioContent" },
  { icon: BarChart3, label: "Analytics", page: "StudioAnalytics" },
  { icon: DollarSign, label: "Earn", page: "StudioEarnings" },
  { icon: MessageSquare, label: "Comments", page: "StudioComments" },
  { icon: Radio, label: "Live", page: "StudioLive" },
  { icon: Users, label: "Community", page: "Community" },
  { icon: Scissors, label: "AI Clips", page: "StudioAIClips" },
  { icon: Sparkles, label: "Shorts", page: "StudioShorts" },
  { icon: Copyright, label: "Copyright", page: "StudioCopyright" },
  { icon: Settings, label: "Settings", page: "StudioSettings" },
];

export default function StudioSidebar({ currentPage }) {
  return (
    <div className="w-60 bg-[#0f0f0f] border-r border-white/5 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Vidio
          </Button>
        </Link>
      </div>

      <div className="p-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-white">Creator Studio</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentPage === item.page
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-gray-500 text-center">
          © 2024 Vidio Studio
        </p>
      </div>
    </div>
  );
}