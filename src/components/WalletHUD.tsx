"use client";

import { motion } from "framer-motion";
import { Plus, Send, Bell, User } from "lucide-react";
import AnimatedBalance from "./AnimatedBalance";

interface WalletHUDProps {
  balance: number;
  onAdd?: () => void;
  onSend?: () => void;
}

export default function WalletHUD({ balance, onAdd, onSend }: WalletHUDProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-4">
      {/* Warm top gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neon-orange/10 via-transparent to-transparent pointer-events-none rounded-b-3xl" />

      {/* Top row: Profile + Notifications */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="glass rounded-full h-10 w-10 flex items-center justify-center"
        >
          <User size={18} className="text-white/70" />
        </motion.button>

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
          Personal &middot; USD
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-5 z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="glass-strong rounded-2xl px-8 py-3 flex items-center gap-2.5 text-neon-green font-semibold text-sm tracking-wide transition-shadow hover:glow-green"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSend}
          className="glass-strong rounded-2xl px-8 py-3 flex items-center gap-2.5 text-neon-pink font-semibold text-sm tracking-wide transition-shadow hover:glow-pink"
        >
          <Send size={18} strokeWidth={2.5} />
          Send
        </motion.button>
      </div>
    </div>
  );
}
