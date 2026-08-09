import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ShieldCheck } from "lucide-react";

export default function StartupComparison({ comparedStartups, onRemoveCompare, onClearAll }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!comparedStartups || comparedStartups.length === 0) return null;

  return (
    <>
      {/* Bottom Floating Bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#1E3B22] text-white rounded-2xl p-3 px-5 shadow-2xl border border-[#2E7D32] flex items-center gap-4 max-w-xl w-[calc(100%-32px)]"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-[#C1652E] font-cinzel">
          <Scale className="w-4 h-4" />
          <span>Compare ({comparedStartups.length}/2)</span>
        </div>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {comparedStartups.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-xl text-xs font-medium border border-white/15"
            >
              <img src={s.logo} alt={s.name} className="w-5 h-5 rounded-full object-cover" />
              <span className="truncate max-w-[100px]">{s.name}</span>
              <button
                onClick={() => onRemoveCompare(s.id)}
                className="hover:text-red-400 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {comparedStartups.length === 2 && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-1.5 bg-[#2E7D32] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              Compare
            </button>
          )}
          <button
            onClick={onClearAll}
            className="text-xs text-gray-300 hover:text-white underline"
          >
            Clear
          </button>
        </div>
      </motion.div>

      {/* Comparison Side-by-Side Modal */}
      <AnimatePresence>
        {modalOpen && comparedStartups.length === 2 && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 relative overflow-y-auto max-h-[90vh] shadow-2xl"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold"
              >
                ✕
              </button>

              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-[#2E7D32] uppercase tracking-widest">
                  Side-By-Side Comparison
                </span>
                <h3 className="text-2xl font-extrabold font-cinzel text-[#1E3B22]">
                  Startup Evaluation Matrix
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 border border-gray-200 rounded-2xl overflow-hidden text-xs font-medium">
                {/* Header */}
                <div className="bg-[#FBF7EC] p-4 font-bold text-gray-700">Parameter</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="bg-[#E2EFE3] p-4 text-center space-y-2 border-l border-gray-200">
                    <img src={s.logo} alt={s.name} className="w-12 h-12 rounded-xl object-cover mx-auto shadow-sm" />
                    <h4 className="font-extrabold text-sm text-[#1E3B22]">{s.name}</h4>
                    <span className="text-[10px] bg-[#1E3B22] text-white font-bold px-2 py-0.5 rounded-full block w-fit mx-auto">
                      {s.category}
                    </span>
                  </div>
                ))}

                {/* Stage */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">Startup Stage</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l font-bold text-gray-800">
                    {s.stage}
                  </div>
                ))}

                {/* Funding */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">Funding Raised</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l font-bold text-[#C1652E]">
                    {s.fundingAmount} ({s.funding})
                  </div>
                ))}

                {/* Technology */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">Technology</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l text-gray-800">
                    {s.technology}
                  </div>
                ))}

                {/* Incubator */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">Incubator</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l text-gray-800">
                    {s.incubator}
                  </div>
                ))}

                {/* State / Location */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">State & Location</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l text-gray-800">
                    {s.location}
                  </div>
                ))}

                {/* Verification */}
                <div className="p-3 bg-gray-50 text-gray-700 border-t">Government Verified</div>
                {comparedStartups.map((s) => (
                  <div key={s.id} className="p-3 text-center border-t border-l font-bold">
                    {s.verified ? (
                      <span className="text-[#2E7D32] flex items-center justify-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">Standard</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-full py-3 bg-[#1E3B22] text-white font-bold text-xs rounded-xl hover:bg-[#2E7D32] transition-all"
              >
                Close Comparison
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
