"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WalletHUD from "./WalletHUD";
import NavDock, { type TabId } from "./NavDock";
import SendMoneyModal from "./SendMoneyModal";
import { useUser } from "@/context/UserProvider";

const TAB_ORDER: TabId[] = ["map", "kalshi"];

interface PersistentLayoutProps {
  children: (activeTab: TabId) => React.ReactNode;
}

export default function PersistentLayout({ children }: PersistentLayoutProps) {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [direction, setDirection] = useState(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const handleTabChange = useCallback(
    (newTab: TabId) => {
      const oldIndex = TAB_ORDER.indexOf(activeTab);
      const newIndex = TAB_ORDER.indexOf(newTab);
      setDirection(newIndex > oldIndex ? 1 : -1);
      setActiveTab(newTab);
    },
    [activeTab]
  );

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      {/* ─── WALLET HUD (Top 25%) ─── */}
      <div className="fixed top-0 left-0 right-0 h-[25vh] z-40">
        <WalletHUD
          balance={profile?.balance ?? 0}
          username={profile?.username ?? "Guest"}
          onSend={() => setSendModalOpen(true)}
        />
        {/* Bottom border glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ─── VIEWPORT (Bottom 75%) ─── */}
      <div className="fixed bottom-0 left-0 right-0 h-[75vh] z-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 overflow-y-auto pb-20 px-4 pt-4"
          >
            {children(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── NAV DOCK (Bottom Fixed) ─── */}
      <NavDock activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ─── Send Money Modal ─── */}
      <SendMoneyModal open={sendModalOpen} onClose={() => setSendModalOpen(false)} />
    </div>
  );
}
