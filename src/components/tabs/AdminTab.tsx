"use client";

import { motion } from "framer-motion";
import { DollarSign, Lock, Target, Megaphone, ChevronRight } from "lucide-react";

const controls = [
  { label: "Add Funds", icon: DollarSign, color: "text-neon-green", bg: "bg-neon-green/10" },
  { label: "Lock All Markets", icon: Lock, color: "text-neon-orange", bg: "bg-neon-orange/10" },
  { label: "Create Bounty", icon: Target, color: "text-neon-pink", bg: "bg-neon-pink/10" },
  { label: "Broadcast Message", icon: Megaphone, color: "text-neon-gold", bg: "bg-neon-gold/10" },
];

const topEarners = [
  { name: "Chris Johnson", amount: 90_000, time: "04/11 12:00" },
  { name: "Stacy M.", amount: 45_000, time: "04/11 12:00" },
  { name: "Alex H.", amount: 39_000, time: "04/11 12:00" },
];

export default function AdminTab() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-white font-bold text-xl tracking-tight text-center italic">
        ADMIN
      </h2>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {controls.map((ctrl) => {
          const Icon = ctrl.icon;
          return (
            <motion.button
              key={ctrl.label}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-2xl p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`${ctrl.bg} rounded-xl h-10 w-10 flex items-center justify-center`}>
                  <Icon size={20} className={ctrl.color} />
                </div>
                <span className="text-white font-semibold text-sm">{ctrl.label}</span>
              </div>
              <ChevronRight size={18} className="text-white/30" />
            </motion.button>
          );
        })}
      </div>

      {/* Top Earners */}
      <div className="glass rounded-3xl p-5 mt-2">
        <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-3">
          Top Earners
        </h3>
        <div className="flex flex-col gap-3">
          {topEarners.map((person, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="glass rounded-full h-9 w-9 flex items-center justify-center text-xs text-white/50 font-semibold">
                  {person.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <span className="text-white text-sm font-medium">{person.name}</span>
                  <div className="text-white/30 text-[10px]">{person.time}</div>
                </div>
              </div>
              <span className="text-neon-gold font-bold text-sm font-mono">
                ${person.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
