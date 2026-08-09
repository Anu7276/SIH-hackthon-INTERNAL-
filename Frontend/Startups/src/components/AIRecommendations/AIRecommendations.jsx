import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, MapPin, TrendingUp, Flame, Award } from "lucide-react";

export default function AIRecommendations({ allStartups, selectedCategory, onSelectStartup }) {
  const [activeTab, setActiveTab] = useState("category"); // 'category', 'trending', 'recentlyFunded', 'investorPicks'

  const recommendations = React.useMemo(() => {
    if (activeTab === "trending") {
      return allStartups.filter((s) => s.trending);
    } else if (activeTab === "recentlyFunded") {
      return allStartups.filter((s) => s.recentlyFunded);
    } else if (activeTab === "investorPicks") {
      return allStartups.filter((s) => s.investorPick);
    } else {
      // Category based
      if (selectedCategory !== "All") {
        return allStartups.filter((s) => s.category === selectedCategory);
      }
      return allStartups.filter((s) => s.matchPercentage >= 90);
    }
  }, [allStartups, selectedCategory, activeTab]);

  return (
    <section className="bg-gradient-to-r from-[#FBF7EC] via-white to-[#E2EFE3]/50 rounded-3xl p-6 sm:p-8 border border-[#C4DEC6] shadow-sm my-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1E3B22] text-[#FBF7EC] rounded-2xl shadow-md">
            <Sparkles className="w-5 h-5 text-[#C1652E]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[#2E7D32] text-xs font-bold uppercase tracking-wider">
              <span>AI Recommendation Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-cinzel text-[#1E3B22]">
              Recommended Startups
            </h2>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-[#FBF7EC] p-1.5 rounded-2xl border border-gray-200 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("category")}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "category"
                ? "bg-[#1E3B22] text-white shadow-sm"
                : "text-gray-600 hover:text-[#1E3B22]"
            }`}
          >
            Category Based
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "trending"
                ? "bg-[#1E3B22] text-white shadow-sm"
                : "text-gray-600 hover:text-[#1E3B22]"
            }`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => setActiveTab("recentlyFunded")}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "recentlyFunded"
                ? "bg-[#1E3B22] text-white shadow-sm"
                : "text-gray-600 hover:text-[#1E3B22]"
            }`}
          >
            💸 Recently Funded
          </button>
          <button
            onClick={() => setActiveTab("investorPicks")}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "investorPicks"
                ? "bg-[#1E3B22] text-white shadow-sm"
                : "text-gray-600 hover:text-[#1E3B22]"
            }`}
          >
            ⭐ Investor Picks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.slice(0, 3).map((startup) => (
          <motion.div
            key={startup.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-[#1E3B22] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C1652E]" /> {startup.matchPercentage || 95}% AI Match
                </span>
                <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E2EFE3] px-2 py-0.5 rounded border border-[#C4DEC6]">
                  {startup.category}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <img
                  src={startup.logo}
                  alt={startup.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-1">
                    {startup.name}
                    {startup.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">{startup.stage} Stage</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-4 font-medium">
                {startup.tagline}
              </p>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-600 bg-[#FBF7EC] p-2.5 rounded-xl mb-4">
                <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span className="truncate">{startup.location}</span>
                <span className="text-gray-300">•</span>
                <Cpu className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span className="truncate">{startup.technology}</span>
              </div>
            </div>

            <button
              onClick={() => onSelectStartup(startup)}
              className="w-full py-2 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Explore Recommendation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
