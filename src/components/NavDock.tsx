"use client";

import { motion } from "framer-motion";
import { Map, BarChart3 } from "lucide-react";

export type TabId = "map" | "kalshi";

interface NavDockProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "map", label: "MAP", icon: Map },
  { id: "kalshi", label: "KUNALSHI", icon: BarChart3 },
];

export default function NavDock({ activeTab, onTabChange }: NavDockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.2 }}
        className="glass-strong rounded-2xl px-1.5 py-1.5 flex items-center gap-0.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10 text-[9px] font-semibold tracking-widest uppercase">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
