"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserProvider";
import type { Market, MarketPosition } from "@/lib/types";

interface BettingDrawerProps {
  open: boolean;
  onClose: () => void;
  market: Market | null;
  yesPosition: MarketPosition | null;
  noPosition: MarketPosition | null;
}

type Mode = "buy" | "sell";
type Outcome = "yes" | "no";
type Step = "form" | "confirm" | "processing" | "success" | "error";

const QUICK_AMOUNTS = [1_000, 5_000, 25_000, 100_000];

// ─── Client-side slippage preview ───
function previewBuy(
  market: Market,
  outcome: Outcome,
  amount: number
): { newPrice: number; avgPrice: number; shares: number; maxPayout: number } {
  const oldPrice = outcome === "yes" ? market.yes_price : market.no_price;
  const impact = amount / market.pool_k;
  const newPrice = Math.min(oldPrice + impact, 0.99);
  const effectiveSpend = (newPrice - oldPrice) * market.pool_k;
  const avgPrice = (oldPrice + newPrice) / 2;
  const shares = avgPrice > 0 ? effectiveSpend / avgPrice : 0;
  return { newPrice, avgPrice, shares, maxPayout: shares * 1.0 };
}

function previewSell(
  market: Market,
  outcome: Outcome,
  shares: number
): { newPrice: number; avgPrice: number; dollars: number } {
  const currentPrice = outcome === "yes" ? market.yes_price : market.no_price;
  const poolK = market.pool_k;
  let dollars = shares * currentPrice * 2 * poolK / (2 * poolK + shares);
  let newPrice = currentPrice - dollars / poolK;

  if (newPrice < 0.01) {
    newPrice = 0.01;
    dollars = (currentPrice - 0.01) * poolK;
  }

  const avgPrice = shares > 0 ? dollars / shares : 0;
  return { newPrice, avgPrice, dollars };
}

export default function BettingDrawer({
  open,
  onClose,
  market,
  yesPosition,
  noPosition,
}: BettingDrawerProps) {
  const { user, profile, refreshProfile } = useUser();
  const [mode, setMode] = useState<Mode>("buy");
  const [outcome, setOutcome] = useState<Outcome>("yes");
  const [amount, setAmount] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{
    shares?: number;
    avg_price?: number;
    spend?: number;
    received?: number;
    shares_sold?: number;
  } | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode("buy");
      setOutcome("yes");
      setAmount("");
      setSharesInput("");
      setStep("form");
      setErrorMsg("");
      setResult(null);
    }
  }, [open]);

  const balance = profile?.balance ?? 0;
  const parsedAmount = Math.floor(Number(amount));
  const parsedShares = Math.floor(Number(sharesInput));
  const activePosition = outcome === "yes" ? yesPosition : noPosition;
  const maxShares = activePosition?.shares_owned ?? 0;

  // Preview calculations
  const buyPreview =
    market && mode === "buy" && parsedAmount > 0
      ? previewBuy(market, outcome, parsedAmount)
      : null;

  const sellPreview =
    market && mode === "sell" && parsedShares > 0
      ? previewSell(market, outcome, parsedShares)
      : null;

  const canSubmitBuy = parsedAmount > 0 && parsedAmount <= balance;
  const canSubmitSell = parsedShares > 0 && parsedShares <= maxShares;
  const canSubmit = mode === "buy" ? canSubmitBuy : canSubmitSell;

  const currentPrice = market
    ? outcome === "yes"
      ? market.yes_price
      : market.no_price
    : 0;

  const handleConfirm = useCallback(async () => {
    if (!user || !market) return;
    setStep("processing");

    try {
      if (mode === "buy") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)("process_trade", {
          p_market_id: market.id,
          p_outcome: outcome,
          p_amount: parsedAmount,
        });
        if (error) throw new Error(error.message);
        setResult(data);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)("process_sell", {
          p_market_id: market.id,
          p_outcome: outcome,
          p_shares: parsedShares,
        });
        if (error) throw new Error(error.message);
        setResult(data);
      }
      await refreshProfile();
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Trade failed");
      setStep("error");
    }
  }, [user, market, mode, outcome, parsedAmount, parsedShares, refreshProfile]);

  if (!open || !market) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="betting-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="betting-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-strong rounded-t-3xl p-6 pb-28 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-wide line-clamp-1 flex-1 mr-2">
              {market.question}
            </h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="glass rounded-full h-9 w-9 flex items-center justify-center shrink-0"
            >
              <X size={18} className="text-white/60" />
            </motion.button>
          </div>

          {/* ── FORM STEP ── */}
          {step === "form" && (
            <div className="flex flex-col gap-3">
              {/* Buy / Sell toggle */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode("buy")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold tracking-wider transition-all ${
                    mode === "buy"
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                      : "glass text-white/40"
                  }`}
                >
                  <TrendingUp size={14} className="inline mr-1" />
                  BUY
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode("sell")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold tracking-wider transition-all ${
                    mode === "sell"
                      ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                      : "glass text-white/40"
                  }`}
                >
                  <TrendingDown size={14} className="inline mr-1" />
                  SELL
                </motion.button>
              </div>

              {/* YES / NO toggle */}
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOutcome("yes")}
                  className={`flex-1 rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition-all ${
                    outcome === "yes"
                      ? "bg-neon-green/15 border border-neon-green/30"
                      : "glass border border-transparent"
                  }`}
                >
                  <span className="text-neon-green text-[10px] font-bold tracking-wider">
                    YES
                  </span>
                  <span className="text-neon-green text-lg font-bold">
                    {(market.yes_price * 100).toFixed(3)}¢
                  </span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOutcome("no")}
                  className={`flex-1 rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition-all ${
                    outcome === "no"
                      ? "bg-neon-pink/15 border border-neon-pink/30"
                      : "glass border border-transparent"
                  }`}
                >
                  <span className="text-neon-pink text-[10px] font-bold tracking-wider">
                    NO
                  </span>
                  <span className="text-neon-pink text-lg font-bold">
                    {(market.no_price * 100).toFixed(3)}¢
                  </span>
                </motion.button>
              </div>

              {/* Input */}
              {mode === "buy" ? (
                <div>
                  <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                    Amount to Spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green font-bold text-lg">
                      $
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full glass rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {parsedAmount > balance && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Insufficient balance
                    </p>
                  )}
                  {/* Quick picks */}
                  <div className="flex gap-2 mt-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <motion.button
                        key={q}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAmount(String(q))}
                        className="flex-1 glass rounded-lg py-1.5 text-[10px] font-bold text-white/40 hover:text-white/60 tracking-wide"
                      >
                        ${q >= 1000 ? `${q / 1000}k` : q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                    Shares to Sell
                    <span className="text-white/20 ml-1">
                      (max: {Math.floor(maxShares).toLocaleString()})
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={sharesInput}
                      onChange={(e) => setSharesInput(e.target.value)}
                      placeholder="0"
                      className="w-full glass rounded-xl px-4 py-3 text-lg font-bold text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-pink/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {parsedShares > maxShares && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> You only have{" "}
                      {Math.floor(maxShares).toLocaleString()} shares
                    </p>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSharesInput(String(Math.floor(maxShares)))
                    }
                    className="mt-2 glass rounded-lg px-3 py-1.5 text-[10px] font-bold text-white/40 hover:text-white/60 tracking-wide"
                  >
                    SELL MAX
                  </motion.button>
                </div>
              )}

              {/* Preview */}
              {mode === "buy" && buyPreview && parsedAmount > 0 && (
                <div className="glass rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Current Price</span>
                    <span className="text-white/70 font-mono">
                      {(currentPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Est. Price After</span>
                    <span className="text-neon-gold font-mono font-semibold">
                      {(buyPreview.newPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Your Avg Price</span>
                    <span className="text-white/70 font-mono">
                      {(buyPreview.avgPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="h-px bg-white/5 my-0.5" />
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Shares</span>
                    <span className="text-white font-mono font-semibold">
                      {Math.floor(buyPreview.shares).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Max Payout</span>
                    <span className="text-neon-green font-mono font-semibold">
                      ${Math.floor(buyPreview.maxPayout).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {mode === "sell" && sellPreview && parsedShares > 0 && (
                <div className="glass rounded-xl p-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Current Price</span>
                    <span className="text-white/70 font-mono">
                      {(currentPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Est. Price After</span>
                    <span className="text-neon-gold font-mono font-semibold">
                      {(sellPreview.newPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">Your Avg Sell Price</span>
                    <span className="text-white/70 font-mono">
                      {(sellPreview.avgPrice * 100).toFixed(3)}¢
                    </span>
                  </div>
                  <div className="h-px bg-white/5 my-0.5" />
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/40">You Receive</span>
                    <span className="text-neon-green font-mono font-semibold">
                      ${Math.floor(sellPreview.dollars).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                onClick={() => setStep("confirm")}
                disabled={!canSubmit}
                className={`w-full rounded-2xl py-3 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                  canSubmit
                    ? mode === "buy"
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/30 hover:glow-green"
                      : "bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:glow-pink"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                {mode === "buy"
                  ? canSubmitBuy
                    ? `Buy ${outcome.toUpperCase()} — $${parsedAmount.toLocaleString()}`
                    : "Buy Shares"
                  : canSubmitSell
                    ? `Sell ${parsedShares.toLocaleString()} ${outcome.toUpperCase()}`
                    : "Sell Shares"}
              </motion.button>
            </div>
          )}

          {/* ── CONFIRM STEP ── */}
          {step === "confirm" && (
            <div className="flex flex-col gap-4 items-center">
              <div className="glass-strong rounded-2xl p-5 w-full text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                  Confirm {mode === "buy" ? "Purchase" : "Sale"}
                </p>
                {mode === "buy" && buyPreview ? (
                  <>
                    <p className="text-2xl font-bold text-neon-green">
                      {Math.floor(buyPreview.shares).toLocaleString()} shares
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {outcome.toUpperCase()} at{" "}
                      {(buyPreview.avgPrice * 100).toFixed(3)}¢ avg
                    </p>
                    <p className="text-xs text-white/30 mt-2">
                      Spending ${parsedAmount.toLocaleString()} · Max payout $
                      {Math.floor(buyPreview.maxPayout).toLocaleString()}
                    </p>
                  </>
                ) : sellPreview ? (
                  <>
                    <p className="text-2xl font-bold text-neon-pink">
                      ${Math.floor(sellPreview.dollars).toLocaleString()}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      Selling {parsedShares.toLocaleString()}{" "}
                      {outcome.toUpperCase()} at{" "}
                      {(sellPreview.avgPrice * 100).toFixed(3)}¢ avg
                    </p>
                  </>
                ) : null}
              </div>

              <div className="flex gap-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("form")}
                  className="flex-1 glass rounded-2xl py-3 text-sm font-semibold text-white/60"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold ${
                    mode === "buy"
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/30 hover:glow-green"
                      : "bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:glow-pink"
                  }`}
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          )}

          {/* ── PROCESSING STEP ── */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="animate-spin text-neon-green" />
              <p className="text-sm text-white/40">Processing trade...</p>
            </div>
          )}

          {/* ── SUCCESS STEP ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={48} className="text-neon-green" />
              </motion.div>
              <p className="text-lg font-bold text-white">
                {mode === "buy" ? "Trade Placed!" : "Shares Sold!"}
              </p>
              {result && mode === "buy" && (
                <p className="text-sm text-white/40 text-center">
                  Bought{" "}
                  {Math.floor(result.shares ?? 0).toLocaleString()} shares at{" "}
                  {((result.avg_price ?? 0) * 100).toFixed(3)}¢
                </p>
              )}
              {result && mode === "sell" && (
                <p className="text-sm text-white/40 text-center">
                  Received ${Math.floor(result.received ?? 0).toLocaleString()}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="glass-strong rounded-2xl px-8 py-3 text-sm font-semibold text-white/70 mt-2"
              >
                Done
              </motion.button>
            </div>
          )}

          {/* ── ERROR STEP ── */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <AlertCircle size={48} className="text-red-400" />
              <p className="text-lg font-bold text-white">Trade Failed</p>
              <p className="text-sm text-red-400/80 text-center">{errorMsg}</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("form")}
                className="glass-strong rounded-2xl px-8 py-3 text-sm font-semibold text-white/70"
              >
                Try Again
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
