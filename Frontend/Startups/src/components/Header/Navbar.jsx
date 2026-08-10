import React, { useState } from "react";
import { Rocket, Users, Handshake, Menu, X, ShieldCheck, Globe, Search, ArrowLeft, Presentation } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#18311B] text-white sticky top-0 z-50 border-b border-[#2E7D32]/50 shadow-lg">
      {/* Top Government Strip */}
      <div className="bg-[#112313] text-[11px] py-1.5 px-4 sm:px-8 border-b border-white/10 text-gray-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 font-medium">
            <a href="/?skipIntro=true" className="inline-flex items-center gap-1 text-white font-bold hover:text-[#9AC59E] bg-white/10 px-2.5 py-0.5 rounded transition-colors mr-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#9AC59E]" />
              Home
            </a>
            <img
              src="https://uxwing.com/wp-content/themes/uxwing/download/flags-landmarks/india-flag-icon.png"
              alt="Indian Flag"
              className="w-4 h-3 object-cover rounded-sm"
            />
            <span className="font-semibold text-white">भारत सरकार</span>
            <span className="text-gray-500">|</span>
            <span className="hidden sm:inline">Government of India</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a href="#main-content" className="hidden md:inline hover:text-[#C1652E] transition-colors">
              Skip to Main Content
            </a>
            <span className="hidden md:inline text-gray-600">|</span>
            <div className="flex items-center gap-1 text-gray-300">
              <Globe className="w-3.5 h-3.5 text-[#2E7D32]" />
              <select className="bg-transparent outline-none cursor-pointer font-medium text-xs text-white">
                <option value="en" className="bg-[#18311B]">English</option>
                <option value="hi" className="bg-[#18311B]">हिंदी</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Logos & Branding */}
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-3 group">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem of India"
              className="h-11 w-auto invert brightness-200"
            />
            <div className="flex flex-col justify-center leading-tight">
              <span className="text-[9px] font-bold tracking-widest text-[#9AC59E] uppercase">
                Ministry of
              </span>
              <strong className="text-xl font-extrabold tracking-wide font-cinzel text-white group-hover:text-[#C1652E] transition-colors">
                AYUSH
              </strong>
              <span className="text-[8px] text-gray-400">Govt. of India</span>
            </div>
          </a>

          <div className="h-8 w-px bg-white/20 hidden md:block"></div>
        </div>

        {/* Right Side Buttons - Matching User Screenshot */}
        <div className="hidden md:flex items-center gap-3">
          {/* Button 1: Register Startup */}
          <button className="px-5 py-2.5 bg-[#2E7D32] hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 border border-emerald-500/30">
            <Rocket className="w-4 h-4 text-white" />
            <span>Register Startup</span>
          </button>

          {/* Button 2: Find Investors */}
          <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center gap-2 backdrop-blur-sm">
            <Users className="w-4 h-4 text-[#C1652E]" />
            <span>Find Investors</span>
          </button>

          {/* Button 4: Virtual Startup Pitcher */}
          <button className="px-5 py-2.5 bg-[#C1652E] hover:bg-amber-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 border border-amber-500/30">
            <Presentation className="w-4 h-4 text-white" />
            <span>Virtual Startup Pitcher</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:text-[#C1652E]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#112313] border-t border-white/10 px-6 py-5 space-y-2.5">
          <button className="w-full py-2.5 bg-[#2E7D32] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2">
            <Rocket className="w-4 h-4" />
            <span>Register Startup</span>
          </button>
          <button className="w-full py-2.5 bg-white/10 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-[#C1652E]" />
            <span>Find Investors</span>
          </button>
          <button className="w-full py-2.5 bg-[#C1652E] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2">
            <Presentation className="w-4 h-4" />
            <span>Virtual Startup Pitcher</span>
          </button>
        </div>
      )}
    </header>
  );
}
