import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Building, IndianRupee, Rocket, ChevronRight } from "lucide-react";

export default function IndiaMap({ mapData, onSelectStateFilter }) {
  const [selectedStateKey, setSelectedStateKey] = useState("Kerala");
  const activeState = mapData[selectedStateKey] || mapData["Kerala"];

  return (
    <section className="bg-gradient-to-br from-[#FBF7EC] via-[#E2EFE3]/40 to-[#FBF7EC] rounded-3xl p-6 sm:p-10 border border-[#C4DEC6] shadow-md my-12">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 border-b border-gray-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[#1E3B22] text-xs font-bold uppercase tracking-wider mb-1 bg-[#E2EFE3] px-3 py-1 rounded-full border border-[#C4DEC6]">
            <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" /> Interactive Regional Directory
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-[#1E3B22]">
            India AYUSH Startup Map
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl font-medium">
            Click any state to inspect registered startups, top local innovators, funding deployment, and incubation hubs.
          </p>
        </div>

        <button
          onClick={() => onSelectStateFilter(activeState.name)}
          className="px-5 py-2.5 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <span>Filter Startups in {activeState.name}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* State Buttons List */}
        <div className="lg:col-span-6 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
            Select State to View Details:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.keys(mapData).map((stateKey) => {
              const stateInfo = mapData[stateKey];
              const isSelected = selectedStateKey === stateKey;
              return (
                <button
                  key={stateKey}
                  onClick={() => setSelectedStateKey(stateKey)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? "bg-[#1E3B22] text-white border-[#1E3B22] shadow-md scale-102"
                      : "bg-white text-gray-800 border-gray-200 hover:border-[#2E7D32] hover:bg-[#E2EFE3]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm block">{stateInfo.name}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#E2EFE3] text-[#1E3B22]"
                      }`}
                    >
                      {stateInfo.registeredStartups}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* State Detail Info Card */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeState.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C4DEC6] shadow-xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs text-[#2E7D32] font-bold uppercase tracking-wider">
                    State Profile
                  </span>
                  <h3 className="text-2xl font-extrabold font-cinzel text-[#1E3B22]">
                    {activeState.name}
                  </h3>
                </div>
                <div className="bg-[#E2EFE3] text-[#1E3B22] p-3 rounded-2xl border border-[#C4DEC6] text-center">
                  <span className="text-2xl font-extrabold font-cinzel block leading-none">
                    {activeState.registeredStartups}
                  </span>
                  <span className="text-[10px] font-bold text-[#2E7D32] block mt-1 uppercase">
                    Registered Startups
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FBF7EC] p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 text-[#2E7D32] mb-1">
                    <Rocket className="w-4 h-4" />
                    <span className="text-xs font-bold text-gray-700">Top Startup</span>
                  </div>
                  <strong className="text-sm font-extrabold text-gray-900 block truncate">
                    {activeState.topStartup}
                  </strong>
                </div>

                <div className="bg-[#FBF7EC] p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 text-[#C1652E] mb-1">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-xs font-bold text-gray-700">Total Funding</span>
                  </div>
                  <strong className="text-sm font-extrabold text-gray-900 block">
                    {activeState.funding}
                  </strong>
                </div>

                <div className="bg-[#FBF7EC] p-4 rounded-2xl border border-gray-200 col-span-2">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Building className="w-4 h-4" />
                    <span className="text-xs font-bold text-gray-700">Incubators & Bio-NESTs</span>
                  </div>
                  <strong className="text-sm font-extrabold text-gray-900 block">
                    {activeState.incubators} Active Centers
                  </strong>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
