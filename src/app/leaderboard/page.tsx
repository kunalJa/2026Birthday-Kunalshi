"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  username: string;
  balance: number;
}

const RANK_COLORS = [
  "from-yellow-400 to-amber-500",   // 1st — gold
  "from-gray-300 to-gray-400",      // 2nd — silver
  "from-amber-600 to-orange-700",   // 3rd — bronze
  "from-neon-green/80 to-neon-green/40", // 4th
  "from-neon-green/60 to-neon-green/20", // 5th
];

const RANK_ICONS = [
  <Crown key="1" size={20} className="text-yellow-400" />,
  <Medal key="2" size={20} className="text-gray-300" />,
  <Medal key="3" size={20} className="text-amber-600" />,
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("profiles") as any)
        .select("id, username, balance")
        .order("balance", { ascending: false });

      if (data) setEntries(data as LeaderboardEntry[]);
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  const maxBalance = entries.length > 0 ? entries[0].balance : 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-neon-gold" />
      </div>
    );
  }

  const top5 = entries.slice(0, 5);
  const rest = entries.slice(5);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-6 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="glass rounded-full h-10 w-10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </motion.div>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy size={24} className="text-neon-gold" />
            Leaderboard
          </h1>
          <p className="text-xs text-white/30 tracking-wide">Who&apos;s running the economy?</p>
        </div>
      </div>

      {/* ─── Top 5 Podium Cards ─── */}
      <div className="flex flex-col gap-3 mb-8">
        {top5.map((entry, i) => {
          const pct = maxBalance > 0 ? (entry.balance / maxBalance) * 100 : 0;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
              className="glass-strong rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
            >
              {/* Background bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${RANK_COLORS[i] ?? "from-white/10 to-white/5"} opacity-15 rounded-2xl`}
              />

              {/* Rank */}
              <div className="relative z-10 w-8 flex items-center justify-center">
                {i < 3 ? (
                  RANK_ICONS[i]
                ) : (
                  <span className="text-sm font-bold text-white/40">#{i + 1}</span>
                )}
              </div>

              {/* Info */}
              <div className="relative z-10 flex-1 min-w-0">
                <p className="font-bold text-sm truncate">
                  @{entry.username}
                </p>
              </div>

              {/* Balance */}
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.4, type: "spring" }}
                className={`relative z-10 text-lg font-bold tabular-nums ${
                  i === 0 ? "text-yellow-400 text-glow-gold" : i < 3 ? "text-white" : "text-neon-green"
                }`}
              >
                ${entry.balance.toLocaleString()}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Bar Chart: Everyone ─── */}
      {entries.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-4">
            Wealth Distribution
          </h2>
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => {
              const pct = maxBalance > 0 ? Math.max((entry.balance / maxBalance) * 100, 2) : 2;
              const isTop5 = i < 5;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[11px] text-white/30 w-16 truncate text-right font-medium">
                    @{entry.username}
                  </span>
                  <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.04, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isTop5
                          ? i === 0
                            ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                            : i === 1
                            ? "bg-gradient-to-r from-gray-300 to-gray-400"
                            : i === 2
                            ? "bg-gradient-to-r from-amber-600 to-orange-700"
                            : "bg-gradient-to-r from-neon-green/70 to-neon-green/40"
                          : "bg-gradient-to-r from-white/20 to-white/10"
                      }`}
                    />
                    {entry.balance > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/60">
                        ${entry.balance.toLocaleString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Rest of the players ─── */}
      {rest.length > 0 && (
        <div>
          <h2 className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">
            Everyone Else
          </h2>
          <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
            {rest.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.03 }}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/20 font-bold w-6 text-center">
                    #{i + 6}
                  </span>
                  <span className="text-sm text-white/60">@{entry.username}</span>
                </div>
                <span className="text-sm font-semibold text-white/40 tabular-nums">
                  ${entry.balance.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/20 text-sm">No players yet</p>
        </div>
      )}
    </div>
  );
}
