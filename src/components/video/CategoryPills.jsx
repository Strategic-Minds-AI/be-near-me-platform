import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "All",
  "Gaming",
  "Music",
  "Live",
  "Vlogs",
  "Education",
  "Entertainment",
  "Sports",
  "News",
  "Tech",
  "Comedy",
  "Film",
  "How-to",
  "Travel",
  "Food",
  "Fashion",
  "Art",
  "Science",
  "Pets",
  "Recently Uploaded",
  "Watched",
];

export default function CategoryPills({ selected, onSelect }) {
  const containerRef = useRef(null);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative">
      {/* Left scroll button */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f] to-transparent z-10 pr-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Categories */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-12 py-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <Button
            key={category}
            variant="ghost"
            onClick={() => onSelect(category)}
            className={`flex-shrink-0 rounded-lg px-4 h-9 text-sm font-medium transition-all duration-200 ${
              selected === category
                ? "bg-white text-black hover:bg-gray-200 hover:text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Right scroll button */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-[#0f0f0f] via-[#0f0f0f] to-transparent z-10 pl-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}