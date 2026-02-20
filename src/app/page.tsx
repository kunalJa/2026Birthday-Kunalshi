"use client";

import { useState } from "react";
import { useUser } from "@/context/UserProvider";
import LoginScreen from "@/components/LoginScreen";
import PersistentLayout from "@/components/PersistentLayout";
import WelcomeReveal from "@/components/WelcomeReveal";
import MapTab from "@/components/tabs/MapTab";
import KalshiTab from "@/components/tabs/KalshiTab";
import type { TabId } from "@/components/NavDock";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  map: MapTab,
  kalshi: KalshiTab,
};

export default function Home() {
  const { user, profile, loading, refreshProfile } = useUser();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 size={32} className="animate-spin text-neon-gold" />
          <span className="text-white/30 text-sm tracking-widest uppercase">Loading...</span>
        </motion.div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    return <LoginScreen />;
  }

  // First-time welcome reveal
  if (!profile.has_seen_welcome && !welcomeDismissed) {
    return (
      <WelcomeReveal
        balance={profile.balance}
        username={profile.username ?? "Guest"}
        userId={user.id}
        onComplete={() => {
          setWelcomeDismissed(true);
          refreshProfile();
        }}
      />
    );
  }

  // Authenticated — show the game
  return (
    <PersistentLayout>
      {(activeTab) => {
        const TabComponent = TAB_COMPONENTS[activeTab];
        return <TabComponent />;
      }}
    </PersistentLayout>
  );
}
