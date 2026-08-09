import React from "react";
import { Rocket, Users, Handshake, ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section className="my-16 bg-gradient-to-r from-[#18311B] via-[#1E3B22] to-[#2E7D32] text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-[#2E7D32]">
      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold border border-white/15 text-[#C1652E]">
          <ShieldCheck className="w-4 h-4" />
          <span>MINISTRY OF AYUSH ECOSYSTEM INITIATIVE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold font-cinzel leading-tight">
          Build the Future of <span className="text-[#C1652E]">AYUSH</span>
        </h2>

        <p className="text-sm sm:text-base text-[#FBF7EC]/90 max-w-2xl mx-auto leading-relaxed font-medium">
          Join over 1,200+ registered startups, 300+ investors, and 150+ incubators shaping the next era of bio-botanical medicine, digital health, and holistic wellness across India.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button className="w-full sm:w-auto px-8 py-3.5 bg-[#2E7D32] hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <Rocket className="w-4 h-4" />
            <span>Register Startup</span>
          </button>

          <button className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-[#C1652E]" />
            <span>Find Investors</span>
          </button>

          <button className="w-full sm:w-auto px-8 py-3.5 bg-[#C1652E] hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <Handshake className="w-4 h-4" />
            <span>Join Ecosystem</span>
          </button>
        </div>
      </div>
    </section>
  );
}
