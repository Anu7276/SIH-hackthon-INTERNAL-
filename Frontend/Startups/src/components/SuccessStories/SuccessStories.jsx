import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, Quote, IndianRupee, Users, ArrowUpRight } from "lucide-react";

export default function SuccessStories({ stories }) {
  const [activeModalStory, setActiveModalStory] = useState(null);

  if (!stories || stories.length === 0) return null;

  return (
    <section className="my-16 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#C1652E] uppercase tracking-widest bg-[#C1652E]/10 px-3 py-1 rounded-full border border-[#C1652E]/20">
          Impact & Milestones
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold font-cinzel text-[#1E3B22]">
          AYUSH Success Stories
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Discover how pioneering founders transformed traditional healthcare wisdom into high-growth, government-backed enterprises.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            whileHover={{ y: -6 }}
            className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={story.image}
                  alt={story.startupName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <span className="bg-[#1E3B22]/90 backdrop-blur-md text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-white/20">
                    {story.startupName}
                  </span>
                  <span className="text-xs font-bold text-[#C1652E] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Awarded
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={story.founderImage}
                    alt={story.founderName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#2E7D32] shadow-sm"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{story.founderName}</h4>
                    <span className="text-[11px] text-gray-500 font-medium">Founder, {story.startupName}</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-[#1E3B22] leading-snug font-cinzel">
                  {story.title}
                </h3>

                <div className="relative bg-[#FBF7EC] p-4 rounded-2xl border border-gray-200/80 italic text-xs text-gray-700 leading-relaxed font-medium">
                  <Quote className="w-4 h-4 text-[#2E7D32] mb-1 opacity-60" />
                  "{story.quote}"
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-700 pt-1">
                  <div className="flex items-center gap-1.5 bg-[#E2EFE3] p-2 rounded-xl text-[#1E3B22] border border-[#C4DEC6]">
                    <IndianRupee className="w-3.5 h-3.5 text-[#C1652E]" />
                    <span>{story.funding}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#FBF7EC] p-2 rounded-xl text-gray-800 border border-gray-200">
                    <Users className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>{story.impact}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setActiveModalStory(story)}
                className="w-full py-2.5 bg-[#FBF7EC] hover:bg-[#1E3B22] text-[#1E3B22] hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-gray-200"
              >
                <span>Read Story</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {activeModalStory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setActiveModalStory(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <img
                src={activeModalStory.founderImage}
                alt={activeModalStory.founderName}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#2E7D32]"
              />
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">{activeModalStory.founderName}</h3>
                <span className="text-xs font-bold text-[#2E7D32]">{activeModalStory.startupName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xl font-bold font-cinzel text-[#1E3B22]">{activeModalStory.title}</h4>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{activeModalStory.quote}</p>
            </div>

            <div className="bg-[#FBF7EC] p-4 rounded-2xl space-y-2 text-xs border border-gray-200">
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Award / Recognition:</span>
                <strong className="text-[#2E7D32]">{activeModalStory.recognition}</strong>
              </div>
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Funding Raised:</span>
                <strong className="text-[#C1652E]">{activeModalStory.funding}</strong>
              </div>
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Ecosystem Impact:</span>
                <strong className="text-[#1E3B22]">{activeModalStory.impact}</strong>
              </div>
            </div>

            <button
              onClick={() => setActiveModalStory(null)}
              className="w-full py-3 bg-[#1E3B22] hover:bg-[#2E7D32] text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
