import React, { useState } from "react";
import StartupCard from "../StartupCard/StartupCard";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";

export default function StartupGrid({
  startups,
  onSelectStartup,
  bookmarks,
  onToggleBookmark,
  comparedStartups,
  onToggleCompare,
  resetFilters
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(startups.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedStartups = startups.slice(startIndex, startIndex + itemsPerPage);

  if (startups.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm max-w-xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 bg-[#FBF7EC] rounded-full flex items-center justify-center mx-auto text-[#2E7D32]">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-cinzel text-[#1E3B22]">No Startups Found</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto font-medium">
          We couldn't find any AYUSH startups matching your search query or selected filter criteria.
        </p>
        <button
          onClick={resetFilters}
          className="px-6 py-2.5 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {displayedStartups.map((startup) => (
          <StartupCard
            key={startup.id}
            startup={startup}
            onSelectStartup={onSelectStartup}
            isBookmarked={bookmarks.includes(startup.id)}
            onToggleBookmark={onToggleBookmark}
            isCompared={comparedStartups.some((s) => s.id === startup.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs font-medium text-gray-600">
            Showing <strong>{startIndex + 1}</strong> to{" "}
            <strong>{Math.min(startIndex + itemsPerPage, startups.length)}</strong> of{" "}
            <strong>{startups.length}</strong> startups
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-[#E2EFE3] hover:text-[#2E7D32] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[#1E3B22] px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-[#E2EFE3] hover:text-[#2E7D32] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
