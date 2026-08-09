import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Bookmark,
  Share2,
  MapPin,
  Calendar,
  Building,
  User,
  IndianRupee,
  Cpu,
  ArrowRight,
  TrendingUp,
  Scale
} from "lucide-react";

export default function StartupCard({
  startup,
  onSelectStartup,
  isBookmarked,
  onToggleBookmark,
  isCompared,
  onToggleCompare
}) {
  const [shareToast, setShareToast] = useState(false);

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: startup.name,
        text: startup.tagline,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={startup.logo}
                alt={startup.name}
                className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm group-hover:scale-105 transition-transform"
              />
              {startup.trending && (
                <span className="absolute -top-2 -right-2 bg-[#C1652E] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> Hot
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-lg text-[#1E3B22] group-hover:text-[#2E7D32] transition-colors">
                  {startup.name}
                </h3>
                {startup.verified && (
                  <span className="inline-flex items-center gap-0.5 bg-[#E2EFE3] text-[#1E3B22] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#C4DEC6]">
                    <ShieldCheck className="w-3 h-3 text-[#2E7D32]" /> Verified
                  </span>
                )}
              </div>
              <span className="text-xs text-[#2E7D32] font-bold tracking-wide">{startup.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(startup);
              }}
              title={isCompared ? "Remove from comparison" : "Compare this startup"}
              className={`p-2 rounded-xl transition-all ${
                isCompared
                  ? "bg-[#1E3B22] text-white shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:text-[#1E3B22] hover:bg-[#E2EFE3]"
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(startup.id);
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Startup"}
              className={`p-2 rounded-xl transition-all ${
                isBookmarked
                  ? "bg-[#C1652E] text-white shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:text-[#C1652E] hover:bg-orange-50"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              title="Share Startup Profile"
              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-[#2E7D32] hover:bg-[#E2EFE3] transition-all relative"
            >
              <Share2 className="w-4 h-4" />
              {shareToast && (
                <span className="absolute right-0 top-10 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                  Copied Link!
                </span>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-4 font-medium">
          {startup.tagline}
        </p>

        {/* Tech Stack Tags */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <Cpu className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
          {(startup.techStack || [startup.technology]).map((t) => (
            <span
              key={t}
              className="bg-[#FBF7EC] text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-gray-200"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-700 bg-[#FBF7EC] p-3 rounded-xl mb-4 border border-gray-200/80">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#C1652E] flex-shrink-0" />
            <span className="truncate"><strong>{startup.fundingAmount}</strong> ({startup.funding})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
            <span className="truncate">{startup.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span>Founded {startup.foundedYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="truncate">{startup.founder}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onSelectStartup(startup)}
          className="w-full py-2.5 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
