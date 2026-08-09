import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, ShieldCheck, MapPin, IndianRupee, ArrowUpRight } from "lucide-react";

export default function FeaturedCarousel({ featuredList, onSelectStartup }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth / 1.2 : clientWidth / 1.2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!featuredList || featuredList.length === 0) return null;

  return (
    <section className="bg-gradient-to-r from-[#1E3B22] to-[#2E7D32] text-white rounded-3xl p-6 sm:p-8 my-8 relative overflow-hidden shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[#C1652E] text-xs font-bold uppercase tracking-wider mb-1 bg-[#FBF7EC]/10 px-3 py-1 rounded-full w-fit border border-[#C1652E]/30">
            <Sparkles className="w-4 h-4" />
            <span>Spotlight Innovators</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-white">Featured AYUSH Startups</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory relative z-10"
      >
        {featuredList.map((startup) => (
          <motion.div
            key={startup.id}
            whileHover={{ y: -6 }}
            className="min-w-[280px] sm:min-w-[340px] max-w-[360px] bg-white text-gray-900 rounded-2xl p-5 shadow-lg flex flex-col justify-between flex-shrink-0 snap-start border border-gray-100"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={startup.logo}
                    alt={startup.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-base text-gray-900">{startup.name}</h3>
                      {startup.verified && (
                        <ShieldCheck className="w-4 h-4 text-[#2E7D32] flex-shrink-0" title="Government Verified" />
                      )}
                    </div>
                    <span className="text-xs text-[#2E7D32] font-semibold">{startup.category}</span>
                  </div>
                </div>
                <span className="bg-[#E2EFE3] text-[#1E3B22] text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-[#C4DEC6]">
                  {startup.stage}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                {startup.tagline}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-600 bg-[#FBF7EC] p-2.5 rounded-xl mb-4 border border-gray-100">
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-[#C1652E]" />
                  <span>{startup.fundingAmount} ({startup.funding})</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span className="truncate">{startup.location}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectStartup(startup)}
              className="w-full py-2.5 bg-[#E2EFE3] hover:bg-[#2E7D32] text-[#1E3B22] hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-[#C4DEC6]"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
