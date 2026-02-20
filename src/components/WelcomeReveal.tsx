"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PartyPopper } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface WelcomeRevealProps {
  balance: number;
  username: string;
  userId: string;
  onComplete: () => void;
}

// Simple confetti particle
function ConfettiPiece({ delay, x }: { delay: number; x: number }) {
  const colors = [
    "bg-neon-green",
    "bg-neon-pink",
    "bg-neon-gold",
    "bg-neon-orange",
    "bg-white",
    "bg-yellow-400",
    "bg-emerald-400",
    "bg-pink-400",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 8 + 4;
  const rotation = Math.random() * 360;
  const duration = Math.random() * 2 + 2;

  return (
    <motion.div
      className={`absolute top-0 ${color} rounded-sm pointer-events-none`}
      style={{
        width: size,
        height: size * (Math.random() > 0.5 ? 2.5 : 1),
        left: `${x}%`,
        rotate: rotation,
      }}
      initial={{ y: -20, opacity: 1 }}
      animate={{
        y: "100vh",
        opacity: [1, 1, 0],
        rotate: rotation + Math.random() * 720,
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration,
        delay,
        ease: "easeIn",
      }}
    />
  );
}

type Phase = "intro" | "drumroll" | "reveal" | "celebrate";

export default function WelcomeReveal({
  balance,
  username,
  userId,
  onComplete,
}: WelcomeRevealProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [displayBalance, setDisplayBalance] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number }[]>([]);
  const rafRef = useRef<number>(0);

  // Spawn confetti burst
  const spawnConfetti = useCallback(() => {
    const pieces = Array.from({ length: 80 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
    }));
    setConfetti(pieces);
  }, []);

  // Animate the balance counting up
  const animateBalance = useCallback(() => {
    const start = performance.now();
    const duration = 2500;
    const from = 0;
    const to = balance;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.floor(from + (to - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [balance]);

  // Phase transitions
  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => setPhase("drumroll"), 2000);
      return () => clearTimeout(t);
    }
    if (phase === "drumroll") {
      const t = setTimeout(() => setPhase("reveal"), 2500);
      return () => clearTimeout(t);
    }
    if (phase === "reveal") {
      animateBalance();
      spawnConfetti();
      const t = setTimeout(() => setPhase("celebrate"), 3000);
      return () => {
        clearTimeout(t);
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [phase, animateBalance, spawnConfetti]);

  // Mark welcome as seen
  const handleContinue = async () => {
    await (supabase.from("profiles") as any)
      .update({ has_seen_welcome: true })
      .eq("id", userId);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center px-8 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
          animate={{
            backgroundColor:
              phase === "reveal" || phase === "celebrate"
                ? "rgba(74, 222, 128, 0.15)"
                : "rgba(251, 191, 36, 0.08)",
          }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <ConfettiPiece key={c.id} delay={c.delay} x={c.x} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── INTRO ── */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <PartyPopper size={64} className="text-neon-gold" />
            </motion.div>
            <h1 className="text-3xl font-black text-white text-center">
              Welcome, <span className="text-neon-green">@{username}</span>!
            </h1>
            <p className="text-white/40 text-sm text-center">
              Every guest gets a party bankroll...
            </p>
          </motion.div>
        )}

        {/* ── DRUMROLL ── */}
        {phase === "drumroll" && (
          <motion.div
            key="drumroll"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="flex flex-col items-center gap-6 z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            >
              <Sparkles size={56} className="text-neon-gold" />
            </motion.div>
            <motion.p
              className="text-2xl font-bold text-white tracking-wider"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              Your bankroll is...
            </motion.p>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-neon-gold"
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── REVEAL ── */}
        {(phase === "reveal" || phase === "celebrate") && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 360] }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <PartyPopper size={48} className="text-neon-green" />
            </motion.div>

            <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-semibold">
              You&apos;re starting the party with
            </p>

            <motion.div
              className="text-5xl sm:text-6xl font-black text-neon-green text-glow-green"
              animate={
                phase === "celebrate"
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ${displayBalance.toLocaleString()}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/30 text-sm text-center max-w-xs"
            >
              Trade on prediction markets, send money to friends, and make the party legendary 🎉
            </motion.p>

            {phase === "celebrate" && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                className="mt-6 bg-gradient-to-r from-neon-green/80 to-neon-green/60 text-black font-bold text-sm tracking-wide rounded-2xl px-10 py-4"
              >
                LET&apos;S GO 🎉
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
