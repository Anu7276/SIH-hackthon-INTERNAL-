import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-[#C4DEC6] flex gap-3 items-center">
      <div className="relative flex-1 w-full flex items-center">
        <Search className="w-5 h-5 text-[#2E7D32] ml-3 absolute left-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search startups by name, technology, founder, or state (e.g., AyuGyan, AI, Kerala)..."
          className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-transparent border-0 outline-none text-gray-900 placeholder-gray-400 font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      <button className="px-6 py-3 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center gap-2">
        <Search className="w-4 h-4" />
        <span>Search</span>
      </button>
    </div>
  );
}
