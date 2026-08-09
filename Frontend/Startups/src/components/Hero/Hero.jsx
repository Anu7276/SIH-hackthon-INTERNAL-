import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import SearchBar from "../Search/SearchBar";
import CategoryChips from "../Categories/CategoryChips";

export default function Hero({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
}) {
  return (
    <section 
      className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-8 border-b border-[#C4DEC6]/60"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(240, 245, 241, 0.82), rgba(228, 236, 230, 0.76)), url("/dash_main.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Animated Leaf SVG Watermarks */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 opacity-10 pointer-events-none animate-pulse-slow">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#1E3B22"
            d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.6,81.4,29.1,73.1,41.9C64.8,54.7,53.8,65.7,40.7,73.1C27.6,80.4,13.8,84.2,-0.8,85.6C-15.4,87,-30.8,86,-43.8,79.6C-56.8,73.1,-67.4,61.2,-75.2,47.7C-83,34.2,-88,17.1,-87.3,0.4C-86.6,-16.3,-80.2,-32.6,-71.4,-45.8C-62.6,-59,-51.4,-69.1,-38,-76.8C-24.6,-84.5,-9,-89.8,4.5,-87.2C18,-84.6,30.6,-83.6,44.7,-76.4Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6">
        {/* Government Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E3B22] text-[#FBF7EC] text-xs font-bold border border-[#2E7D32] shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 text-[#C1652E]" />
          <span>MINISTRY OF AYUSH • STARTUP DISCOVERY PLATFORM</span>
        </motion.div>

        {/* Heading & Subheading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#1E3B22] tracking-tight font-cinzel leading-tight"
        >
          Discover <span className="text-[#2E7D32]">AYUSH</span> Startups
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium"
        >
          One-stop platform to discover innovative AYUSH startups across India in Ayurveda, Yoga, Unani, Siddha, Homeopathy, Sowa Rigpa, and Wellness Tech.
        </motion.p>

        {/* Search & Category Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-2 space-y-4 max-w-4xl mx-auto"
        >
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <CategoryChips
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
          />
        </motion.div>
      </div>
    </section>
  );
}
