import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import BrandLogo from "@/components/BrandLogo";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  Flame,
  Music2,
  Gamepad2,
  Film,
  Radio,
  Trophy,
  Lightbulb,
  Menu,
  X,
  Search,
  Bell,
  Upload,
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
  Plus,
  Target,
  Wallet,
  Activity,
  Sparkles,
  MessageCircleHeart
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: channel } = useQuery({
    queryKey: ['myChannel', user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const myChannel = channel?.[0];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl(`Search?q=${encodeURIComponent(searchQuery)}`));
    }
  };

  const mainNav = [
    { icon: Home, label: "Home", page: "Home" },
    { icon: Compass, label: "Explore", page: "Explore" },
    { icon: PlaySquare, label: "Shorts", page: "Shorts" },
    { icon: PlaySquare, label: "Subscriptions", page: "Subscriptions" },
    { icon: Sparkles, label: "AI Buddy", page: "AIBuddy" },
    { icon: Target, label: "Dares", page: "Dares" },
    { icon: MessageCircleHeart, label: "Truths", page: "Truths" },
    { icon: Lightbulb, label: "Premium", page: "Premium" },
    { icon: Target, label: "Benchmark", page: "Benchmark" },
  ];

  const libraryNav = [
    { icon: Clock, label: "History", page: "History" },
    { icon: ThumbsUp, label: "Liked Videos", page: "LikedVideos" },
    { icon: PlaySquare, label: "Playlists", page: "Playlists" },
  ];

  const categoryNav = [
    { icon: Flame, label: "Trending", page: "Trending" },
    { icon: Music2, label: "Music", page: "Category?c=music" },
    { icon: Gamepad2, label: "Gaming", page: "Category?c=gaming" },
    { icon: Film, label: "Films", page: "Category?c=film" },
    { icon: Radio, label: "Live", page: "Live" },
    { icon: Trophy, label: "Sports", page: "Category?c=sports" },
    { icon: Lightbulb, label: "Learning", page: "Category?c=education" },
  ];

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {mobile && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img src="https://media.base44.com/images/public/6abd9e05a56938f03c2c557b/a04d45d75_image.png" alt="BeNearMe" className="h-8 w-auto rounded-md bg-white px-1 py-0.5" />
        </div>
      )}
      
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                ${currentPageName === item.page 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Library</p>
          {libraryNav.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
                ${currentPageName === item.page 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
          {categoryNav.map((item) => (
            <Link
              key={item.label}
              to={createPageUrl(item.page)}
              onClick={() => mobile && setSidebarOpen(false)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          © 2024 BeNearMe ·{" "}
          <Link to={createPageUrl("About")} className="hover:text-gray-300 transition-colors">About</Link>
          {" · "}
          <Link to={createPageUrl("Contact")} className="hover:text-gray-300 transition-colors">Contact</Link>
          {" · Terms · Privacy"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <style>{`
        :root {
          --background: 0 0% 6%;
          --foreground: 0 0% 98%;
          --card: 0 0% 8%;
          --card-foreground: 0 0% 98%;
          --popover: 0 0% 8%;
          --popover-foreground: 0 0% 98%;
          --primary: 310 100% 58%;
          --primary-foreground: 0 0% 98%;
          --secondary: 0 0% 14%;
          --secondary-foreground: 0 0% 98%;
          --muted: 0 0% 14%;
          --muted-foreground: 0 0% 64%;
          --accent: 0 0% 14%;
          --accent-foreground: 0 0% 98%;
          --destructive: 0 62% 50%;
          --destructive-foreground: 0 0% 98%;
          --border: 0 0% 14%;
          --input: 0 0% 14%;
          --ring: 310 100% 58%;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f0f]/95 backdrop-blur-lg border-b border-white/5 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-[#0f0f0f] border-white/10">
                <SidebarContent mobile />
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <BrandLogo className="h-8 w-auto" />
            </Link>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-12 bg-white/5 border-white/10 rounded-full text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-white/20"
              />
              <Button 
                type="submit"
                size="icon" 
                variant="ghost" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Camera")}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                <Upload className="w-5 h-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
              <Bell className="w-5 h-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border-2 border-transparent hover:border-pink-500 transition-colors">
                      <AvatarImage src={myChannel?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-200 via-pink-500 to-fuchsia-600 text-white">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#212121] border-white/10">
                  <div className="px-3 py-3 border-b border-white/10">
                    <p className="font-medium text-white">{user.full_name || "User"}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  
                  {myChannel ? (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl(`Channel?id=${myChannel.id}`)} className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Your Channel
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("CreateChannel")} className="flex items-center gap-2 cursor-pointer">
                        <Plus className="w-4 h-4" />
                        Create Channel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Wallet")} className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4" />
                      My Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Onboarding")} className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="w-4 h-4" />
                      Onboarding
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Settings")} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("AnalyticsTraffic")} className="flex items-center gap-2 cursor-pointer">
                        <Activity className="w-4 h-4" />
                        Platform Analytics
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Admin")} className="flex items-center gap-2 cursor-pointer">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  <DropdownMenuItem 
                    onClick={() => base44.auth.logout()}
                    className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:opacity-90 text-white rounded-full px-4"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 bg-[#0f0f0f] border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}