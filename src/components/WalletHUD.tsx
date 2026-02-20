"use client";

import { motion } from "framer-motion";
import { Send, User } from "lucide-react";
import AnimatedBalance from "./AnimatedBalance";

interface WalletHUDProps {
  balance: number;
  username: string;
  onSend?: () => void;
}

export default function WalletHUD({ balance, username, onSend }: WalletHUDProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-2">
      {/* Warm top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-orange/10 via-transparent to-transparent pointer-events-none rounded-b-3xl" />

      {/* Top row: Username */}
      <div className="absolute top-2 left-6 z-10">
        <div className="flex items-center gap-2">
          <div className="glass rounded-full h-8 w-8 flex items-center justify-center">
            <User size={14} className="text-white/70" />
          </div>
          <span className="text-xs font-semibold text-white/70 tracking-wide">
            @{username}
          </span>
        </div>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-center gap-0.5 z-10">
        <AnimatedBalance
          value={balance}
          className="text-4xl font-bold tracking-tight text-white text-glow-gold"
        />
        <span className="text-xs text-white/40 tracking-wide">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon-green mr-1 align-middle" />
          Active
        </span>
      </div>

      {/* Send Button */}
      <div className="flex gap-4 mt-3 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          className="glass-strong rounded-xl px-8 py-2 flex items-center gap-2 text-neon-green font-semibold text-xs tracking-wide transition-shadow hover:glow-green"
        >
          <Send size={14} strokeWidth={2.5} />
          Send Money
        </motion.button>
      </div>
    </div>
  );
}
