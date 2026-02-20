"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Market } from "@/lib/types";

export default function AdminTab() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    marketId: string;
    outcome: "yes" | "no";
  } | null>(null);

  const fetchMarkets = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("markets") as any)
      .select("*")
      .order("resolved_at", { ascending: true, nullsFirst: true })
      .order("question", { ascending: true });
    if (data) setMarkets(data as Market[]);
  }, []);

  useEffect(() => {
    fetchMarkets().then(() => setLoading(false));
  }, [fetchMarkets]);

  async function handleResolve(marketId: string, outcome: "yes" | "no") {
    setResolving(marketId);
    setConfirmTarget(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("resolve_market", {
      p_market_id: marketId,
      p_winning_outcome: outcome,
    });

    if (error) {
      alert(`Resolution failed: ${error.message}`);
    } else if (data) {
      alert(`Resolved! ${data.winners} winners, $${Math.floor(data.total_payout).toLocaleString()} paid out.`);
    }

    setResolving(null);
    fetchMarkets();
  }

  const activeMarkets = markets.filter((m) => !m.outcome);
  const resolvedMarkets = markets.filter((m) => !!m.outcome);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <h2 className="text-white font-bold text-xl tracking-tight text-center italic">
        ADMIN
      </h2>

      {/* ── Market Resolution ── */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUp size={16} className="text-neon-gold" />
        <h3 className="text-white/60 text-xs font-semibold tracking-widest uppercase">
          Market Resolution
        </h3>
      </div>

      {activeMarkets.length === 0 && (
        <p className="text-white/20 text-sm italic text-center py-2">
          No active markets to resolve
        </p>
      )}

      {activeMarkets.map((market) => (
        <div key={market.id} className="glass rounded-2xl p-4">
          <h4 className="text-white font-semibold text-sm mb-2">{market.question}</h4>
          <div className="flex items-center gap-2 text-[10px] text-white/30 mb-3">
            <span>YES: {(market.yes_price * 100).toFixed(3)}¢</span>
            <span>·</span>
            <span>NO: {(market.no_price * 100).toFixed(3)}¢</span>
            <span>·</span>
            <span>Vol: ${Math.floor(market.total_volume).toLocaleString()}</span>
          </div>

          {resolving === market.id ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 size={16} className="animate-spin text-white/30" />
              <span className="text-white/30 text-xs ml-2">Resolving...</span>
            </div>
          ) : confirmTarget?.marketId === market.id ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-neon-orange text-xs">
                <AlertTriangle size={14} />
                <span>
                  Resolve as <strong>{confirmTarget.outcome.toUpperCase()}</strong>? This pays out all winners.
                </span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmTarget(null)}
                  className="flex-1 glass rounded-xl py-2 text-xs font-semibold text-white/50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    handleResolve(confirmTarget.marketId, confirmTarget.outcome)
                  }
                  className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                    confirmTarget.outcome === "yes"
                      ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                      : "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                  }`}
                >
                  Confirm {confirmTarget.outcome.toUpperCase()}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setConfirmTarget({ marketId: market.id, outcome: "yes" })
                }
                className="flex-1 rounded-xl py-2 text-xs font-bold bg-neon-green/10 text-neon-green border border-neon-green/20 flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={12} /> Resolve YES
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setConfirmTarget({ marketId: market.id, outcome: "no" })
                }
                className="flex-1 rounded-xl py-2 text-xs font-bold bg-neon-pink/10 text-neon-pink border border-neon-pink/20 flex items-center justify-center gap-1"
              >
                <XCircle size={12} /> Resolve NO
              </motion.button>
            </div>
          )}
        </div>
      ))}

      {/* ── Resolved Markets ── */}
      {resolvedMarkets.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 mt-4">
            <span className="text-white/30 text-xs font-semibold tracking-widest uppercase">
              Already Resolved
            </span>
          </div>

          {resolvedMarkets.map((market) => (
            <div key={market.id} className="glass rounded-2xl p-4 opacity-50">
              <div className="flex items-start justify-between">
                <h4 className="text-white/50 font-semibold text-sm flex-1 mr-2">
                  {market.question}
                </h4>
                <span
                  className={`shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-wider rounded-full px-2 py-0.5 ${
                    market.outcome === "yes"
                      ? "text-neon-green bg-neon-green/10"
                      : "text-neon-pink bg-neon-pink/10"
                  }`}
                >
                  {market.outcome === "yes" ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <XCircle size={10} />
                  )}
                  {market.outcome?.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
