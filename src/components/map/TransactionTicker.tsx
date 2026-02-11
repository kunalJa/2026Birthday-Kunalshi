"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

export interface FeedItem {
  id: string;
  text: string;
  timestamp: number;
}

interface TransactionFeedProps {
  items: FeedItem[];
}

export default function TransactionFeed({ items }: TransactionFeedProps) {
  return (
    <div className="flex flex-col px-4 pb-3 pt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Activity size={12} className="text-neon-green" />
        <span className="text-[10px] text-white/30 font-semibold tracking-widest uppercase">
          Live
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto overscroll-contain pr-1">
        <AnimatePresence initial={false}>
          {items.length === 0 && (
            <p className="text-[11px] text-white/20 italic">Waiting for activity…</p>
          )}
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="text-xs text-white/60 font-medium leading-relaxed py-1 border-b border-white/5 last:border-0"
            >
              <span className="text-neon-green font-semibold">$</span> {item.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
