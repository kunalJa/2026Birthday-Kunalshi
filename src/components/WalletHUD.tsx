"use client";

import { motion } from "framer-motion";
import { Send, Bell, User } from "lucide-react";
import AnimatedBalance from "./AnimatedBalance";

interface WalletHUDProps {
  balance: number;
  username: string;
  onSend?: () => void;
}

export default function WalletHUD({ balance, username, onSend }: WalletHUDProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-4">
      {/* Warm top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-orange/10 via-transparent to-transparent pointer-events-none rounded-b-3xl" />

      {/* Top row: Username + Notifications */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="glass rounded-full h-10 w-10 flex items-center justify-center">
            <User size={18} className="text-white/70" />
          </div>
          <span className="text-sm font-semibold text-white/70 tracking-wide">
            @{username}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="glass rounded-full h-10 w-10 flex items-center justify-center relative"
          >
            <Bell size={18} className="text-white/70" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-neon-green" />
          </motion.button>
        </div>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-center gap-1 mt-4 z-10">
        <AnimatedBalance
          value={balance}
          className="text-5xl font-bold tracking-tight text-white text-glow-gold"
        />
        <span className="text-sm text-white/40 tracking-wide mt-1">
          <span className="inline-block h-2 w-2 rounded-full bg-neon-green mr-1.5 align-middle" />
          Active
        </span>
      </div>

      {/* Send Button */}
      <div className="flex gap-4 mt-5 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          className="glass-strong rounded-2xl px-10 py-3 flex items-center gap-2.5 text-neon-green font-semibold text-sm tracking-wide transition-shadow hover:glow-green"
        >
          <Send size={18} strokeWidth={2.5} />
          Send Money
        </motion.button>
      </div>
    </div>
  );
}
