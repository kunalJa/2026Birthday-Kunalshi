"use client";

import { motion } from "framer-motion";

interface MapToastProps {
  x: number;
  y: number;
  text: string;
}

export default function MapToast({ x, y, text }: MapToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.7 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${Math.min(85, x + 3)}%`,
        top: `${Math.max(2, y - 4)}%`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="glass-strong rounded-xl px-3 py-1.5 max-w-[180px] border border-neon-green/20 shadow-[0_0_12px_rgba(57,255,20,0.15)]">
        <p className="text-[10px] text-white/80 font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
