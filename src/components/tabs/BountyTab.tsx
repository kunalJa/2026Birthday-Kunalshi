"use client";

import { motion } from "framer-motion";
import { Lock, Target } from "lucide-react";

const bounties = [
  { title: "Find someone wearing red shoes", emoji: "👟", reward: 2000, claimed: false },
  { title: "Get a photo with the host", emoji: "🤳", reward: 5000, claimed: false },
  { title: "Touch the ceiling", emoji: "☝️", reward: 300, claimed: false },
];

export default function BountyTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <Target size={16} className="text-neon-pink" />
        <h2 className="text-white/60 text-xs font-semibold tracking-widest uppercase">
          Missions
        </h2>
      </div>

      {bounties.map((bounty, i) => (
        <motion.div
          key={i}
          whileTap={{ scale: 0.98 }}
          className="glass rounded-3xl p-5 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{bounty.emoji}</span>
            <div>
              <h3 className="text-white font-medium text-sm">{bounty.title}</h3>
              <span className="text-white/30 text-xs">Tap to view details</span>
            </div>
          </div>
          <span className="text-neon-gold font-bold text-lg font-mono">
            ${bounty.reward.toLocaleString()}
          </span>
        </motion.div>
      ))}

      {/* Secret Mission */}
      <div className="glass rounded-3xl p-5">
        <h3 className="text-white/40 font-semibold text-sm mb-3">Secret Mission</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-white/20" />
              <span className="text-white/40 text-sm">Activated</span>
            </div>
            <span className="text-white/20 text-sm">&gt;</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-white/20" />
              <span className="text-white/40 text-sm">Payout</span>
            </div>
            <span className="text-white/20 text-sm">&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
