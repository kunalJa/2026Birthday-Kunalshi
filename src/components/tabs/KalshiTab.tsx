"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const markets = [
  { question: "Will it rain tonight?", yesOdds: 1.42, noOdds: 2.90, yesProb: "1.32" },
  { question: "Will Jake confess?", yesOdds: 3.10, noOdds: 1.20, noProb: "1.20" },
  { question: "DJ plays Sandstorm before midnight?", yesOdds: 1.80, noOdds: 2.10, yesProb: "2.10" },
];

export default function KalshiTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp size={16} className="text-neon-gold" />
        <h2 className="text-white/60 text-xs font-semibold tracking-widest uppercase">
          Prediction Markets
        </h2>
      </div>

      {markets.map((market, i) => (
        <motion.div
          key={i}
          whileTap={{ scale: 0.98 }}
          className="glass rounded-3xl p-5 cursor-pointer"
        >
          <h3 className="text-white font-semibold text-base mb-4">{market.question}</h3>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 rounded-2xl bg-neon-green/10 border border-neon-green/20 py-3 px-4 flex flex-col items-center gap-1"
            >
              <span className="text-neon-green text-xs font-semibold tracking-wider">YES</span>
              <span className="text-neon-green text-2xl font-bold">{market.yesOdds.toFixed(2)}</span>
            </motion.button>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-white/20" />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 py-3 px-4 flex flex-col items-center gap-1"
            >
              <span className="text-neon-pink text-xs font-semibold tracking-wider">NO</span>
              <span className="text-neon-pink text-2xl font-bold">{market.noOdds.toFixed(2)}</span>
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
