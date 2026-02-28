"use client";

import { motion } from "framer-motion";
import { Send, User, LogOut } from "lucide-react";
import AnimatedBalance from "./AnimatedBalance";

interface WalletHUDProps {
  balance: number;
  username: string;
  team?: "red" | "blue" | null;
  onSend?: () => void;
  onLogout?: () => void;
}

export default function WalletHUD({ balance, username, team, onSend, onLogout }: WalletHUDProps) {
  const isRed = team === "red";
  const isBlue = team === "blue";
  const hasTeam = isRed || isBlue;

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-2">
      {/* Top gradient — team-colored in phase 2 */}
      <div
        className="absolute inset-0 pointer-events-none rounded-b-3xl"
        style={{
          background: hasTeam
            ? isRed
              ? "linear-gradient(to bottom, rgba(239,68,68,0.15), transparent 70%)"
              : "linear-gradient(to bottom, rgba(59,130,246,0.15), transparent 70%)"
            : "linear-gradient(to bottom, rgba(255,165,0,0.1), transparent 70%)",
        }}
      />

      {/* Team accent strip at very top */}
      {hasTeam && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full"
          style={{
            background: isRed
              ? "linear-gradient(90deg, transparent, #ef4444, #f87171, #ef4444, transparent)"
              : "linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)",
            boxShadow: isRed
              ? "0 0 12px rgba(239,68,68,0.4)"
              : "0 0 12px rgba(59,130,246,0.4)",
          }}
        />
      )}

      {/* Top row: Username + Logout */}
      <div className="absolute top-2 left-6 right-6 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-full h-8 w-8 flex items-center justify-center"
            style={{
              background: hasTeam
                ? isRed
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(59,130,246,0.15)"
                : "rgba(255,255,255,0.06)",
              border: hasTeam
                ? `1px solid ${isRed ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`
                : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <User size={14} className={hasTeam ? (isRed ? "text-red-400" : "text-blue-400") : "text-white/70"} />
          </div>
          <span className={`text-xs font-semibold tracking-wide ${
            hasTeam ? (isRed ? "text-red-300/80" : "text-blue-300/80") : "text-white/70"
          }`}>
            @{username}
          </span>
          {hasTeam && (
            <span
              className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${
                isRed
                  ? "bg-red-500/15 text-red-400 border border-red-500/25"
                  : "bg-blue-500/15 text-blue-400 border border-blue-500/25"
              }`}
            >
              {team}
            </span>
          )}
        </div>
        {/* <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLogout}
          className="glass rounded-full h-8 w-8 flex items-center justify-center"
        >
          <LogOut size={14} className="text-white/40" />
        </motion.button> */}
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
