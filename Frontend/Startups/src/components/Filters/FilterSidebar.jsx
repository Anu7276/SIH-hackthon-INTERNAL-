import React, { useState } from "react";
import { Filter, RotateCcw, SlidersHorizontal, ShieldCheck, Award } from "lucide-react";

export default function FilterSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedTechnology,
  setSelectedTechnology,
  selectedState,
  setSelectedState,
  selectedFunding,
  setSelectedFunding,
  selectedStage,
  setSelectedStage,
  selectedIncubator,
  setSelectedIncubator,
  verifiedOnly,
  setVerifiedOnly,
  govSupportedOnly,
  setGovSupportedOnly,
  sortBy,
  setSortBy,
  resetFilters,
  categories,
  technologies,
  states,
  stages,
  fundingTypes,
  totalResults
}) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      {/* Mobile Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="flex items-center gap-2 font-bold text-[#1E3B22] text-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#2E7D32]" />
          <span>Filters & Sort ({totalResults})</span>
        </button>
        <span className="text-xs text-[#2E7D32] font-semibold bg-[#E2EFE3] px-2 py-1 rounded">
          {mobileFilterOpen ? "Hide" : "Show"}
        </span>
      </div>

      {/* Filter Body */}
      <div
        className={`bg-white rounded-2xl p-5 border border-[#C4DEC6] shadow-sm space-y-6 sticky top-6 ${
          mobileFilterOpen ? "block" : "hidden lg:block"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-[#1E3B22] font-bold font-cinzel">
            <Filter className="w-4 h-4 text-[#2E7D32]" />
            <span>Advanced Filters</span>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#2E7D32] font-semibold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#FBF7EC] border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#2E7D32]"
          >
            <option value="newest">Newest First</option>
            <option value="trending">Trending & Popular</option>
            <option value="funding">Funding Raised</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#FBF7EC] border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#2E7D32]"
          >
            <option value="All">All AYUSH Streams</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Technology */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Technology</label>
          <select
            value={selectedTechnology}
            onChange={(e) => setSelectedTechnology(e.target.value)}
            className="w-full bg-[#FBF7EC] border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#2E7D32]"
          >
            <option value="All">All Technologies</option>
            {technologies.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">State / Region</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-[#FBF7EC] border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-[#2E7D32]"
          >
            <option value="All">All Indian States</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Startup Stage */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Startup Stage</label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {stages.map((stage) => (
              <label
                key={stage}
                className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-[#2E7D32] cursor-pointer p-1 rounded hover:bg-[#E2EFE3]"
              >
                <input
                  type="checkbox"
                  checked={selectedStage.includes(stage)}
                  onChange={() => {
                    if (selectedStage.includes(stage)) {
                      setSelectedStage(selectedStage.filter((s) => s !== stage));
                    } else {
                      setSelectedStage([...selectedStage, stage]);
                    }
                  }}
                  className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                <span>{stage}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Funding Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Funding Stage</label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {fundingTypes.map((funding) => (
              <label
                key={funding}
                className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-[#2E7D32] cursor-pointer p-1 rounded hover:bg-[#E2EFE3]"
              >
                <input
                  type="checkbox"
                  checked={selectedFunding.includes(funding)}
                  onChange={() => {
                    if (selectedFunding.includes(funding)) {
                      setSelectedFunding(selectedFunding.filter((f) => f !== funding));
                    } else {
                      setSelectedFunding([...selectedFunding, funding]);
                    }
                  }}
                  className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
                />
                <span>{funding}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Verification & Govt Support */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Verification & Support</label>
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              <span className="flex items-center gap-1 text-[#2E7D32]">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Startup
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={govSupportedOnly}
                onChange={(e) => setGovSupportedOnly(e.target.checked)}
                className="rounded text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              <span className="flex items-center gap-1 text-[#C1652E]">
                <Award className="w-3.5 h-3.5" /> Govt Supported
              </span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
