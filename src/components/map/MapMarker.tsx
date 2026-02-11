"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MapMarkerProps {
  x: number;
  y: number;
  emoji: string;
  label: string;
  description?: string | null;
}

export default function MapMarker({ x, y, emoji, label, description }: MapMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => setShowTooltip((v) => !v)}
        className="relative flex items-center justify-center"
      >
        {/* Pulsing ring */}
        <span className="marker-ring absolute h-6 w-6 rounded-full border-2 border-neon-green/60" />
        {/* Center dot */}
        <span className="relative h-3 w-3 rounded-full bg-white shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute left-1/2 -translate-x-1/2 top-6 glass-strong rounded-xl px-3 py-2 min-w-[120px] text-center pointer-events-none"
          >
            <div className="text-base leading-none">{emoji}</div>
            <div className="text-white text-xs font-semibold mt-1">{label}</div>
            {description && (
              <div className="text-white/40 text-[10px] mt-0.5">{description}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
