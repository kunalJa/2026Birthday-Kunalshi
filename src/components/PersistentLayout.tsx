"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WalletHUD from "./WalletHUD";
import NavDock, { type TabId } from "./NavDock";
import SendMoneyModal from "./SendMoneyModal";
import { useUser } from "@/context/UserProvider";
import { supabase } from "@/lib/supabase";

const TAB_ORDER: TabId[] = ["map", "kalshi"];

interface PersistentLayoutProps {
  children: (activeTab: TabId) => React.ReactNode;
}

export default function PersistentLayout({ children }: PersistentLayoutProps) {
  const { profile, signOut } = useUser();
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [direction, setDirection] = useState(0);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [mapPhase, setMapPhase] = useState(1);

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("game_settings") as any)
        .select("value")
        .eq("key", "map_phase")
        .single();
      if (data?.value) setMapPhase(parseInt(data.value, 10));
    })();
  }, []);

  const activeTeam = mapPhase >= 2 ? (profile?.team ?? null) : null;

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
    <div className="relative h-[100dvh] w-screen flex flex-col overflow-hidden bg-zinc-950">
      {/* ─── WALLET HUD (shrink-0, fixed height) ─── */}
      <div className="relative shrink-0 h-[180px] z-40">
        <WalletHUD
          balance={profile?.balance ?? 0}
          username={profile?.username ?? "Guest"}
          team={activeTeam}
          onSend={() => setSendModalOpen(true)}
          onLogout={() => signOut()}
        />
        {/* Bottom border glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ─── VIEWPORT (fills remaining space) ─── */}
      <div className="relative flex-1 min-h-0 z-10 overflow-hidden">
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

      {/* ─── Team accent strip at very bottom of app ─── */}
      {activeTeam && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px] z-50"
          style={{
            background: activeTeam === "red"
              ? "linear-gradient(90deg, transparent, #ef4444, #f87171, #ef4444, transparent)"
              : "linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)",
            boxShadow: activeTeam === "red"
              ? "0 0 12px rgba(239,68,68,0.4)"
              : "0 0 12px rgba(59,130,246,0.4)",
          }}
        />
      )}
    </div>
  );
}
