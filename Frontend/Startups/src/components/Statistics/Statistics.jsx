import React from "react";
import { motion } from "framer-motion";
import { Rocket, Users, Building2, Map } from "lucide-react";

export default function Statistics({ stats }) {
  const statsItems = [
    {
      label: "Registered Startups",
      value: stats?.registeredStartups || "1,200+",
      icon: Rocket,
      color: "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20",
    },
    {
      label: "Empowered Investors",
      value: stats?.investors || "300+",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    {
      label: "Incubators & Bio-NESTs",
      value: stats?.incubators || "150+",
      icon: Building2,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
    },
    {
      label: "States & UTs Covered",
      value: stats?.states || "25+",
      icon: Map,
      color: "bg-[#C1652E]/10 text-[#C1652E] border-[#C1652E]/20",
    },
  ];

  return (
    <section className="bg-white rounded-3xl p-8 my-10 border border-[#C4DEC6] shadow-md">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="text-xs font-bold text-[#C1652E] uppercase tracking-widest">
          National Impact Metrics
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-cinzel text-[#1E3B22]">
          Startup AYUSH Ecosystem Scale
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsItems.map((st, i) => {
          const IconComponent = st.icon;
          return (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-[#FBF7EC] p-5 rounded-2xl border border-gray-200/80 text-center space-y-3 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${st.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <strong className="text-2xl sm:text-3xl font-extrabold text-[#1E3B22] block font-cinzel">
                  {st.value}
                </strong>
                <span className="text-xs font-semibold text-gray-700 block mt-1">
                  {st.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
