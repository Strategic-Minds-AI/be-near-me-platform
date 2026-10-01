import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import BrandLogo from "@/components/BrandLogo";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Compass,
  Plus,
  Bell,
  User,
  Search,
  LogOut,
  Settings,
  Shield,
  Activity,
  Wallet,
  Sparkles,
  Target,
  MessageCircleHeart,
  X,
  Youtube,
  Rocket,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FEED_PAGES = ["Home", "Shorts"];

export default function Layout({ children, currentPageName }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: async () => (await base44.entities.Channel.filter({ created_by: user?.email }, { limit: 1 })).items,
    enabled: !!user?.email,
  });

  const myChannel = channel?.[0];
  const isFeed = FEED_PAGES.includes(currentPageName);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl(`Search?q=${encodeURIComponent(searchQuery)}`));
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Bottom navigation — TikTok style: Home, Explore, Create, Inbox, Profile
  const bottomNav = [
    { icon: Home, label: "Home", page: "Home" },
    { icon: Compass, label: "Explore", page: "Explore" },
    { icon: Plus, label: "Create", page: "Camera", isCreate: true },
    { icon: Bell, label: "Inbox", page: "Notifications" },
    { icon: User, label: "Profile", page: myChannel ? `Channel?id=${myChannel.id}` : "CreateChannel" },
  ];

  const isActive = (page) => {
    const path = location.pathname.replace(/^\//, "").split("?")[0];
    if (page === "Home") return currentPageName === "Home" || path === "" || path === "Home";
    return currentPageName === page || path.startsWith(page.split("?")[0]);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Top bar (hidden on full-screen feed) ── */}
      {!isFeed && (
        <header className="fixed top-0 inset-x-0 h-14 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-full px-4">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <BrandLogo className="h-7 w-auto" />
            </Link>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen((s) => !s)}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <Search className="w-5 h-5" />
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8 border-2 border-transparent hover:border-pink-500 transition-colors">
                        <AvatarImage src={myChannel?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 text-white text-sm">
                          {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 bg-[#1a1a1a] border-white/10 text-white">
                    <div className="px-3 py-3 border-b border-white/10">
                      <p className="font-medium truncate">{user.full_name || "User"}</p>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl(myChannel ? `Channel?id=${myChannel.id}` : "CreateChannel")} className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" /> Your Channel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Wallet")} className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="w-4 h-4" /> My Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Onboarding")} className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4" /> Onboarding
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Dares")} className="flex items-center gap-2 cursor-pointer">
                        <Target className="w-4 h-4" /> Dares
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Truths")} className="flex items-center gap-2 cursor-pointer">
                        <MessageCircleHeart className="w-4 h-4" /> Truths
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AnalyticsTraffic")} className="flex items-center gap-2 cursor-pointer">
                          <Activity className="w-4 h-4" /> Platform Analytics
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("ViralVideoCreator")} className="flex items-center gap-2 cursor-pointer">
                        <Rocket className="w-4 h-4" /> Viral Video Creator
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("SyncDashboard")} className="flex items-center gap-2 cursor-pointer">
                        <Server className="w-4 h-4" /> Persistent Sync
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("DomainOps")} className="flex items-center gap-2 cursor-pointer">
                        <Activity className="w-4 h-4" /> Domain Operations
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("VideoScraper")} className="flex items-center gap-2 cursor-pointer">
                          <Youtube className="w-4 h-4" /> Video Scraper
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Admin")} className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={() => base44.auth.logout()}
                      className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 text-white rounded-full px-4 h-8 text-sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Expandable search bar */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="px-4 pb-3">
              <div className="relative">
                <Input
                  autoFocus
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 bg-white/5 border-white/10 rounded-full text-white placeholder:text-gray-500 focus:bg-white/10"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </header>
      )}

      {/* ── Feed overlay top bar (minimal, floats over video) ── */}
      {isFeed && user && (
        <div className="fixed top-3 right-3 z-40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0 bg-black/30 backdrop-blur">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={myChannel?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 text-white text-sm">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-[#1a1a1a] border-white/10 text-white">
              <div className="px-3 py-3 border-b border-white/10">
                <p className="font-medium truncate">{user.full_name || "User"}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl(myChannel ? `Channel?id=${myChannel.id}` : "CreateChannel")} className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" /> Your Channel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Wallet")} className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="w-4 h-4" /> My Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Dares")} className="flex items-center gap-2 cursor-pointer">
                  <Target className="w-4 h-4" /> Dares
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Truths")} className="flex items-center gap-2 cursor-pointer">
                  <MessageCircleHeart className="w-4 h-4" /> Truths
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </DropdownMenuItem>
              {user.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Admin")} className="flex items-center gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── Main content ── */}
      <main className={isFeed ? "h-screen" : "pt-14 pb-16 min-h-screen"}>
        {children}
      </main>

      {/* ── Bottom navigation (Premium) ── */}
      <nav className="fixed bottom-0 inset-x-0 h-14 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
        <div className="flex items-center justify-around h-full max-w-md mx-auto px-2">
          {bottomNav.map((item) => {
            const active = isActive(item.page);
            if (item.isCreate) {
              return (
                <Link
                  key={item.label}
                  to={createPageUrl(item.page)}
                  className="flex items-center justify-center"
                >
                  <div className="w-12 h-8 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                    <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                to={createPageUrl(item.page)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              >
                <item.icon
                  className={`w-6 h-6 transition-all ${active ? "text-white drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" : "text-gray-500"}`}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={`text-[10px] font-bold transition-all ${active ? "text-white" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}