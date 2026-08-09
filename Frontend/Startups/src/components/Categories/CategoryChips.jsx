import React from "react";
import { Sparkles } from "lucide-react";

export default function CategoryChips({ selectedCategory, setSelectedCategory, categories }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
      <span className="text-xs font-bold text-[#C1652E] uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" /> Streams:
      </span>
      <button
        onClick={() => setSelectedCategory("All")}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          selectedCategory === "All"
            ? "bg-[#1E3B22] text-[#FBF7EC] shadow-md"
            : "bg-white text-gray-700 hover:bg-[#E2EFE3] border border-gray-200"
        }`}
      >
        All Categories
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === cat
              ? "bg-[#1E3B22] text-[#FBF7EC] shadow-md"
              : "bg-white text-gray-700 hover:bg-[#E2EFE3] border border-gray-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
