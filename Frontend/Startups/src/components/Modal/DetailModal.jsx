import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Award,
  MapPin,
  Calendar,
  Building,
  User,
  IndianRupee,
  Cpu,
  ExternalLink
} from "lucide-react";

export default function DetailModal({ startup, onClose }) {
  if (!startup) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl max-w-3xl w-full my-8 overflow-hidden shadow-2xl relative border border-gray-200"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-white bg-black/40 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative h-56 w-full">
            <img
              src={startup.coverImage || startup.image}
              alt={startup.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={startup.logo}
                  alt={startup.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold font-cinzel">{startup.name}</h2>
                    {startup.verified && (
                      <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#FBF7EC]/90 font-medium">
                    <span>{startup.category}</span>
                    <span>•</span>
                    <span>{startup.stage} Stage</span>
                    <span>•</span>
                    <span>{startup.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-[#FBF7EC] p-4 rounded-2xl border border-gray-200">
              <h3 className="font-extrabold text-base text-[#1E3B22] mb-1">Mission & Innovation</h3>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {startup.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-gray-700 bg-white p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#2E7D32]" />
                <span>Founder(s): <strong>{startup.founder}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#2E7D32]" />
                <span>Incubator: <strong>{startup.incubator}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#C1652E]" />
                <span>Funding: <strong>{startup.fundingAmount} ({startup.funding})</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2E7D32]" />
                <span>Founded Year: <strong>{startup.foundedYear}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                Technology Stack
              </span>
              <div className="flex flex-wrap gap-2">
                {(startup.techStack || [startup.technology]).map((t) => (
                  <span
                    key={t}
                    className="bg-[#E2EFE3] text-[#1E3B22] text-xs font-bold px-3 py-1 rounded-lg border border-[#C4DEC6] flex items-center gap-1.5"
                  >
                    <Cpu className="w-3.5 h-3.5" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {startup.awards && startup.awards.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Recognitions & Grants
                </span>
                <div className="space-y-1.5">
                  {startup.awards.map((award) => (
                    <div
                      key={award}
                      className="flex items-center gap-2 text-xs font-bold text-gray-800 bg-[#FBF7EC] p-2.5 rounded-xl border border-gray-200"
                    >
                      <Award className="w-4 h-4 text-[#C1652E]" />
                      <span>{award}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <a
                href={startup.website || "#"}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Visit Official Startup Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
