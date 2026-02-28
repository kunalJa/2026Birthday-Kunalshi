"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Heart, ArrowLeft, Flame, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ═══════════════════════════════════════════════════
// CONFIGURABLE VARIABLES — update these as needed
// ═══════════════════════════════════════════════════
const ENDKUMON_USER_ID = "051f9aec-276a-4061-90ed-628a9067ea1a";
const GAUGE_MAX = 5_000_000;           // Max $ for the thermometer to be "full"
const BIG_DONATION_THRESHOLD = 50_000; // Donations >= this are "big"
const SMALL_DONATION_THRESHOLD = 5_000;// Donations <= this are "small"
const MAX_TEXT_SCALE = 3;              // Max font scale for huge donations
const MIN_TEXT_SCALE = 1;              // Min font scale for tiny donations
const FLOAT_DURATION = 10_000;         // ms before a floating donation fades out
const MAX_VISIBLE_FLOATS = 16;        // max floating donations on screen at once
const POLL_INTERVAL = 2_000;           // ms between polling fallback

type TxRow = {
  id: string;
  amount: number;
  created_at: string;
  sender: { username: string } | null;
};

interface FloatingDonation {
  id: string;
  username: string;
  amount: number;
  side: "left" | "right";
  yOffset: number;
  xOffset: number;
  createdAt: number;
  emoji: string;
}

const DONATION_EMOJIS = ["🔥", "💰", "🚀", "⚡", "💎", "🎉", "❤️", "🙏", "👑", "✨"];
const BIG_EMOJIS = ["🔥🔥🔥", "💰💰💰", "🚀🚀🚀", "👑👑👑", "💎💎💎"];

function getDonationScale(amount: number): number {
  if (amount <= SMALL_DONATION_THRESHOLD) return MIN_TEXT_SCALE;
  if (amount >= BIG_DONATION_THRESHOLD * 3) return MAX_TEXT_SCALE;
  const t = Math.min(
    (amount - SMALL_DONATION_THRESHOLD) /
      (BIG_DONATION_THRESHOLD * 3 - SMALL_DONATION_THRESHOLD),
    1
  );
  return MIN_TEXT_SCALE + t * (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
}

function getDonationColor(amount: number): string {
  if (amount >= BIG_DONATION_THRESHOLD * 2) return "text-neon-gold";
  if (amount >= BIG_DONATION_THRESHOLD) return "text-neon-orange";
  if (amount >= SMALL_DONATION_THRESHOLD) return "text-neon-green";
  return "text-white/80";
}

function getEmoji(amount: number): string {
  if (amount >= BIG_DONATION_THRESHOLD) return BIG_EMOJIS[Math.floor(Math.random() * BIG_EMOJIS.length)];
  return DONATION_EMOJIS[Math.floor(Math.random() * DONATION_EMOJIS.length)];
}

// Particle burst component for big donations
function ParticleBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 60 + Math.random() * 80;
    return { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, delay: Math.random() * 0.2 };
  });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${color}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function CharityPage() {
  const [totalRaised, setTotalRaised] = useState(0);
  const [floatingDonations, setFloatingDonations] = useState<FloatingDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenFlash, setScreenFlash] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [latestBig, setLatestBig] = useState<FloatingDonation | null>(null);
  const nextSide = useRef<"left" | "right">("left");
  const seenTxIds = useRef<Set<string>>(new Set());
  const lastFetchTime = useRef<string>(new Date(0).toISOString());
  const thermControls = useAnimation();

  const addDonationFloat = useCallback(
    (tx: TxRow) => {
      if (seenTxIds.current.has(tx.id)) return;
      seenTxIds.current.add(tx.id);

      const amount = Number(tx.amount);
      setTotalRaised((prev) => prev + amount);

      const side = nextSide.current;
      nextSide.current = side === "left" ? "right" : "left";

      const newFloat: FloatingDonation = {
        id: tx.id,
        username: tx.sender?.username ?? "Anonymous",
        amount,
        side,
        yOffset: 5 + Math.random() * 65,
        xOffset: Math.random() * 30,
        createdAt: Date.now(),
        emoji: getEmoji(amount),
      };

      // Big donation effects
      if (amount >= BIG_DONATION_THRESHOLD) {
        setScreenFlash(true);
        setShakeKey((k) => k + 1);
        setLatestBig(newFloat);
        setTimeout(() => setScreenFlash(false), 300);
        setTimeout(() => setLatestBig(null), 3000);
        thermControls.start({
          scale: [1, 1.08, 0.95, 1.04, 1],
          transition: { duration: 0.6, ease: "easeInOut" },
        });
      } else {
        thermControls.start({
          scale: [1, 1.03, 1],
          transition: { duration: 0.3, ease: "easeInOut" },
        });
      }

      setFloatingDonations((prev) => {
        const updated = [...prev, newFloat];
        return updated.length > MAX_VISIBLE_FLOATS
          ? updated.slice(-MAX_VISIBLE_FLOATS)
          : updated;
      });
    },
    [thermControls]
  );

  // Fetch total raised
  const fetchTotal = useCallback(async () => {
    const { data } = await (supabase.from("transactions") as any)
      .select("amount")
      .eq("receiver_id", ENDKUMON_USER_ID);

    if (data) {
      const sum = (data as { amount: number }[]).reduce(
        (acc, tx) => acc + Number(tx.amount),
        0
      );
      setTotalRaised(sum);
    }
    setLoading(false);
  }, []);

  // Mark existing transactions as seen so only NEW ones float
  const markExistingAsSeen = useCallback(async () => {
    const { data } = await (supabase.from("transactions") as any)
      .select("id, created_at")
      .eq("receiver_id", ENDKUMON_USER_ID)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) return;
    const rows = data as { id: string; created_at: string }[];

    rows.forEach((tx) => seenTxIds.current.add(tx.id));
    if (rows.length > 0) {
      lastFetchTime.current = rows[0].created_at;
    }
  }, []);

  // Polling fallback — always works even if 0 initial donations
  const pollNewDonations = useCallback(async () => {
    const { data } = await (supabase.from("transactions") as any)
      .select(
        "id, amount, created_at, sender:profiles!transactions_sender_id_fkey(username)"
      )
      .eq("receiver_id", ENDKUMON_USER_ID)
      .gt("created_at", lastFetchTime.current)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) return;
    const rows = data as TxRow[];

    rows.forEach((tx) => addDonationFloat(tx));
    lastFetchTime.current = rows[rows.length - 1].created_at;
  }, [addDonationFloat]);

  // Supabase Realtime subscription for instant detection
  useEffect(() => {
    const channel = supabase
      .channel("charity-donations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `receiver_id=eq.${ENDKUMON_USER_ID}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; sender_id: string; amount: number; created_at: string };
          if (seenTxIds.current.has(row.id)) return;

          // Fetch sender username
          const { data: senderData } = await (supabase.from("profiles") as any)
            .select("username")
            .eq("id", row.sender_id)
            .single();

          const tx: TxRow = {
            id: row.id,
            amount: Number(row.amount),
            created_at: row.created_at,
            sender: senderData ? { username: senderData.username } : null,
          };

          addDonationFloat(tx);
          if (row.created_at > lastFetchTime.current) {
            lastFetchTime.current = row.created_at;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addDonationFloat]);

  // Cleanup expired floats
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingDonations((prev) =>
        prev.filter((d) => now - d.createdAt < FLOAT_DURATION)
      );
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTotal();
    markExistingAsSeen();
  }, [fetchTotal, markExistingAsSeen]);

  // Polling fallback every 2s
  useEffect(() => {
    const interval = setInterval(pollNewDonations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollNewDonations]);

  const fillPct = Math.min((totalRaised / GAUGE_MAX) * 100, 100);
  const isFull = totalRaised >= GAUGE_MAX;

  const renderFloat = (d: FloatingDonation) => {
    const scale = getDonationScale(d.amount);
    const color = getDonationColor(d.amount);
    const isBig = d.amount >= BIG_DONATION_THRESHOLD;
    const isLeft = d.side === "left";

    return (
      <motion.div
        key={d.id}
        initial={{
          opacity: 0,
          x: isLeft ? -120 : 120,
          scale: 0.3,
          rotate: isLeft ? -15 : 15,
        }}
        animate={{
          opacity: [0, 1, 1, 0.8, 0],
          x: 0,
          scale: [0.3, isBig ? 1.3 : 1.1, 1],
          rotate: 0,
        }}
        transition={{
          duration: FLOAT_DURATION / 1000,
          times: [0, 0.08, 0.15, 0.7, 1],
          x: { type: "spring", stiffness: 300, damping: 20 },
          scale: { duration: 0.5, ease: "easeOut" },
          rotate: { type: "spring", stiffness: 200, damping: 15 },
        }}
        className={`absolute ${isLeft ? "right-2 text-right" : "left-2 text-left"}`}
        style={{
          top: `${d.yOffset}%`,
          [isLeft ? "right" : "left"]: `${d.xOffset}px`,
        }}
      >
        {isBig && <ParticleBurst color="bg-neon-gold" />}
        <div className="relative">
          <motion.p
            className="text-2xl mb-0.5"
            animate={isBig ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: isBig ? 3 : 0, duration: 0.4, ease: "easeInOut" }}
          >
            {d.emoji}
          </motion.p>
          <motion.p
            className={`font-black ${color} leading-tight drop-shadow-lg`}
            style={{
              fontSize: `${scale}rem`,
              textShadow: isBig
                ? "0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 107, 0, 0.4)"
                : "0 0 10px rgba(57, 255, 20, 0.3)",
            }}
            animate={isBig ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: isBig ? 2 : 0, duration: 0.3, ease: "easeInOut" }}
          >
            ${Number(d.amount).toLocaleString()}
          </motion.p>
          <motion.p
            className="text-white/50 font-bold tracking-wide"
            style={{ fontSize: `${Math.max(scale * 0.5, 0.7)}rem` }}
          >
            @{d.username}
          </motion.p>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      key={shakeKey}
      className="fixed inset-0 bg-zinc-950 text-white overflow-hidden"
      animate={
        shakeKey > 0
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, -4, 4, -2, 2, 0] }
          : {}
      }
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Screen flash on big donation */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            className="absolute inset-0 z-[60] pointer-events-none"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                "radial-gradient(circle at center, rgba(255, 215, 0, 0.5), rgba(255, 107, 0, 0.3), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="glass rounded-full h-10 w-10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </motion.div>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-0 right-0 text-center z-40">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-3xl font-black tracking-tight flex items-center justify-center gap-2"
        >
          <Heart size={26} className="text-red-500" fill="currentColor" />
          <span>
            END<span className="text-neon-gold text-glow-gold">KUMON</span>
          </span>
          <Heart size={26} className="text-red-500" fill="currentColor" />
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-xs text-white/40 tracking-[0.3em] uppercase mt-1 font-semibold"
        >
          ✨ Live Charity Fundraiser ✨
        </motion.p>
      </div>

      {/* Big donation banner */}
      <AnimatePresence>
        {latestBig && (
          <motion.div
            className="absolute top-20 left-0 right-0 z-50 text-center pointer-events-none"
            initial={{ opacity: 0, y: -50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div
              className="inline-block px-8 py-4 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,20,0.97), rgba(30,20,10,0.97))",
                border: "2px solid rgba(255, 215, 0, 0.5)",
                boxShadow: "0 0 60px rgba(255, 215, 0, 0.3), 0 0 120px rgba(255, 107, 0, 0.15)",
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <p className="text-lg font-bold text-white/80 mb-1">
                <Zap size={16} className="inline text-neon-gold mr-1" />
                HUGE DONATION
                <Zap size={16} className="inline text-neon-gold ml-1" />
              </p>
              <p className="text-4xl font-black text-neon-gold text-glow-gold">
                ${Number(latestBig.amount).toLocaleString()}
              </p>
              <p className="text-sm font-bold text-white/60 mt-1">
                from @{latestBig.username}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Layout ─── */}
      <div className="flex h-full items-center justify-center pt-20 pb-8 px-2">
        {/* Left floating donations */}
        <div className="flex-1 relative h-full overflow-hidden">
          <AnimatePresence mode="popLayout">
            {floatingDonations.filter((d) => d.side === "left").map(renderFloat)}
          </AnimatePresence>
        </div>

        {/* ─── Thermometer ─── */}
        <motion.div
          className="flex flex-col items-center gap-3 mx-3 h-full max-h-[78vh]"
          animate={thermControls}
        >
          {/* Amount raised */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <motion.p
              key={Math.floor(totalRaised)}
              className="text-4xl font-black tabular-nums text-neon-gold text-glow-gold"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ${Math.floor(totalRaised).toLocaleString()}
            </motion.p>
            <p className="text-[10px] text-white/30 tracking-widest uppercase font-semibold">
              of ${GAUGE_MAX.toLocaleString()} goal
            </p>
          </motion.div>

          {/* Thermometer tube */}
          <div className="relative flex-1 w-20 min-h-0">
            {/* Outer tube */}
            <div className="absolute inset-0 rounded-full bg-white/[0.03] border-2 border-white/10 overflow-hidden">
              {/* Fill */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-full"
                initial={{ height: 0 }}
                animate={{ height: `${fillPct}%` }}
                transition={{ type: "spring", stiffness: 30, damping: 12 }}
                style={{
                  background: isFull
                    ? "linear-gradient(to top, #FFD700, #FF6B00, #FF00FF, #FF00FF)"
                    : fillPct > 66
                    ? "linear-gradient(to top, #39FF14, #FFD700, #FF6B00)"
                    : fillPct > 33
                    ? "linear-gradient(to top, #39FF14, #39FF14, #FFD700)"
                    : "linear-gradient(to top, #39FF14aa, #39FF14)",
                }}
              >
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: isFull
                      ? "0 0 40px rgba(255, 215, 0, 0.7), inset 0 0 30px rgba(255, 107, 0, 0.4)"
                      : "0 0 25px rgba(57, 255, 20, 0.4), inset 0 0 15px rgba(57, 255, 20, 0.3)",
                  }}
                />
                {/* Bubble at top of fill */}
                {fillPct > 3 && (
                  <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/30 blur-sm"
                    animate={{ opacity: [0.4, 0.8] }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.2, ease: "easeInOut" }}
                  />
                )}
              </motion.div>

              {/* Tick marks */}
              {[25, 50, 75].map((tick) => (
                <div
                  key={tick}
                  className="absolute left-2 right-2 border-t border-dashed border-white/10"
                  style={{ bottom: `${tick}%` }}
                >
                  <span className="absolute -right-9 -translate-y-1/2 text-[9px] text-white/25 font-mono font-bold">
                    {tick}%
                  </span>
                </div>
              ))}
            </div>

            {/* Bulb at bottom */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-white/[0.03] border-2 border-white/10 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: isFull
                    ? "radial-gradient(circle, #FFD700, #FF6B00)"
                    : fillPct > 10
                    ? "radial-gradient(circle, #39FF14, #39FF1466)"
                    : "radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                  boxShadow: isFull
                    ? "0 0 50px rgba(255, 215, 0, 0.6), 0 0 100px rgba(255, 107, 0, 0.3)"
                    : fillPct > 10
                    ? "0 0 30px rgba(57, 255, 20, 0.4)"
                    : "none",
                }}
                animate={
                  isFull
                    ? { scale: [1, 1.15, 1] }
                    : fillPct > 50
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: isFull ? 1.5 : 3, ease: "easeInOut" }}
              >
                {isFull ? (
                  <Flame size={28} className="text-white drop-shadow-lg" />
                ) : (
                  <Heart size={24} className="text-red-400 drop-shadow-lg" fill="currentColor" />
                )}
              </motion.div>
            </div>
          </div>

          {/* Percentage */}
          <motion.p
            className="text-sm text-white/40 font-mono font-bold mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {fillPct.toFixed(1)}%
          </motion.p>
        </motion.div>

        {/* Right floating donations */}
        <div className="flex-1 relative h-full overflow-hidden">
          <AnimatePresence mode="popLayout">
            {floatingDonations.filter((d) => d.side === "right").map(renderFloat)}
          </AnimatePresence>
        </div>
      </div>

      {/* Full gauge celebration */}
      <AnimatePresence>
        {isFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neon-gold/15 via-neon-gold/5 to-transparent" />
            <motion.p
              className="absolute bottom-24 left-0 right-0 text-center text-3xl font-black text-neon-gold text-glow-gold tracking-widest uppercase"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              🎉🔥 GOAL REACHED! 🔥🎉
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-zinc-950 gap-4"
          exit={{ opacity: 0 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Heart size={40} className="text-red-500" fill="currentColor" />
          </motion.div>
          <motion.p
            className="text-white/30 text-sm tracking-widest uppercase"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            Loading...
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  );
}
