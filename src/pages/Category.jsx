import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import VideoGrid from "@/components/video/VideoGrid";
import { 
  Music2, 
  Gamepad2, 
  Film, 
  Trophy, 
  Lightbulb, 
  Newspaper,
  Shirt,
  Utensils,
  Plane,
  Palette,
  FlaskConical,
  Cat,
  Car,
  Tv,
  Laugh,
  Wrench
} from "lucide-react";

const categoryInfo = {
  gaming: { label: "Gaming", icon: Gamepad2, color: "from-green-500 to-emerald-600", description: "Let's plays, walkthroughs, and gaming content" },
  music: { label: "Music", icon: Music2, color: "from-red-500 to-pink-600", description: "Music videos, covers, and performances" },
  vlogs: { label: "Vlogs", icon: Tv, color: "from-blue-500 to-indigo-600", description: "Daily life, travel vlogs, and personal stories" },
  education: { label: "Education", icon: Lightbulb, color: "from-yellow-500 to-amber-600", description: "Learn something new every day" },
  entertainment: { label: "Entertainment", icon: Tv, color: "from-purple-500 to-violet-600", description: "Fun and entertaining content" },
  sports: { label: "Sports", icon: Trophy, color: "from-orange-500 to-red-600", description: "Sports highlights and analysis" },
  news: { label: "News", icon: Newspaper, color: "from-slate-500 to-gray-600", description: "Current events and news coverage" },
  tech: { label: "Tech", icon: Wrench, color: "from-cyan-500 to-blue-600", description: "Technology reviews and tutorials" },
  comedy: { label: "Comedy", icon: Laugh, color: "from-pink-500 to-rose-600", description: "Sketches, stand-up, and funny videos" },
  film: { label: "Film & Animation", icon: Film, color: "from-purple-500 to-fuchsia-600", description: "Short films and animated content" },
  howto: { label: "How-to & Style", icon: Wrench, color: "from-teal-500 to-green-600", description: "Tutorials and DIY content" },
  travel: { label: "Travel", icon: Plane, color: "from-sky-500 to-blue-600", description: "Explore the world" },
  food: { label: "Food", icon: Utensils, color: "from-orange-500 to-yellow-600", description: "Cooking, recipes, and food reviews" },
  fashion: { label: "Fashion", icon: Shirt, color: "from-pink-500 to-purple-600", description: "Style tips and fashion content" },
  art: { label: "Art", icon: Palette, color: "from-fuchsia-500 to-pink-600", description: "Art tutorials and creative content" },
  science: { label: "Science", icon: FlaskConical, color: "from-green-500 to-teal-600", description: "Science experiments and explanations" },
  pets: { label: "Pets & Animals", icon: Cat, color: "from-amber-500 to-orange-600", description: "Cute animals and pet content" },
  autos: { label: "Autos & Vehicles", icon: Car, color: "from-zinc-500 to-neutral-600", description: "Cars, motorcycles, and vehicles" },
};

export default function Category() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("c") || "gaming";
  const category = categoryInfo[categoryId] || categoryInfo.gaming;
  const Icon = category.icon;

  const { data: videos, isLoading } = useQuery({
    queryKey: ['categoryVideos', categoryId],
    queryFn: () => base44.entities.Video.filter(
      { visibility: "public", category: categoryId },
      "-views",
      50
    ),
  });

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Hero */}
      <div className={`relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r ${category.color} p-8 md:p-12`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Icon className="w-10 h-10 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">{category.label}</h1>
          </div>
          <p className="text-white/80 text-lg max-w-xl">
            {category.description}
          </p>
        </div>
        <div className="absolute right-8 bottom-0 opacity-10">
          <Icon className="w-48 h-48" />
        </div>
      </div>

      {/* Videos */}
      <VideoGrid videos={videos} isLoading={isLoading} />
    </div>
  );
}