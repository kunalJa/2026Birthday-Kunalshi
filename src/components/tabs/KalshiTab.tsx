"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserProvider";
import type { Market, MarketPosition } from "@/lib/types";
import BettingDrawer from "@/components/BettingDrawer";

export default function KalshiTab() {
  const { user } = useUser();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<MarketPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mktData } = await (supabase.from("markets") as any)
      .select("*")
      .order("resolved_at", { ascending: true, nullsFirst: true })
      .order("question", { ascending: true });

    if (mktData) setMarkets(mktData as Market[]);

    if (user?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: posData } = await (supabase.from("market_positions") as any)
        .select("*")
        .eq("user_id", user.id)
        .gt("shares_owned", 0);

      if (posData) setPositions(posData as MarketPosition[]);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, [fetchData]);

  // Poll every 5s for price updates
  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function openDrawer(market: Market) {
    setSelectedMarket(market);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedMarket(null);
    // Refresh data after trade
    fetchData();
  }

  // Get user position for a specific market + outcome
  function getPosition(marketId: string, outcome: string): MarketPosition | null {
    return positions.find((p) => p.market_id === marketId && p.outcome === outcome) ?? null;
  }

  // Split markets into active vs resolved
  const activeMarkets = markets.filter((m) => !m.outcome);
  const resolvedMarkets = markets.filter((m) => !!m.outcome);

  // Get positions for the selected market to pass to the drawer
  const drawerYesPos = selectedMarket ? getPosition(selectedMarket.id, "yes") : null;
  const drawerNoPos = selectedMarket ? getPosition(selectedMarket.id, "no") : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* ── Active Markets ── */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUp size={16} className="text-neon-gold" />
        <h2 className="text-white/60 text-xs font-semibold tracking-widest uppercase">
          Prediction Markets
        </h2>
        <span className="text-white/20 text-[10px] ml-auto font-mono">
          {activeMarkets.length} open
        </span>
      </div>

      {activeMarkets.length === 0 && (
        <p className="text-white/20 text-sm italic text-center py-4">
          No active markets yet
        </p>
      )}

      {activeMarkets.map((market) => {
        const yesPos = getPosition(market.id, "yes");
        const noPos = getPosition(market.id, "no");
        const hasPosition = (yesPos && yesPos.shares_owned > 0) || (noPos && noPos.shares_owned > 0);

        return (
          <motion.div
            key={market.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => openDrawer(market)}
            className="glass rounded-2xl p-4 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-semibold text-sm flex-1 mr-2 leading-snug">
                {market.question}
              </h3>
              {hasPosition && (
                <span className="shrink-0 text-[9px] text-neon-gold font-bold tracking-wider bg-neon-gold/10 rounded-full px-2 py-0.5">
                  HELD
                </span>
              )}
            </div>

            {/* Prices */}
            <div className="flex gap-2 mb-2">
              <div className="flex-1 rounded-xl bg-neon-green/8 border border-neon-green/15 py-2 px-3 flex items-center justify-between">
                <span className="text-neon-green text-[10px] font-bold tracking-wider">YES</span>
                <span className="text-neon-green text-lg font-bold font-mono">
                  {(market.yes_price * 100).toFixed(3)}¢
                </span>
              </div>
              <div className="flex-1 rounded-xl bg-neon-pink/8 border border-neon-pink/15 py-2 px-3 flex items-center justify-between">
                <span className="text-neon-pink text-[10px] font-bold tracking-wider">NO</span>
                <span className="text-neon-pink text-lg font-bold font-mono">
                  {(market.no_price * 100).toFixed(3)}¢
                </span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-between text-[10px] text-white/20 px-0.5">
              <span>Vol: ${Math.floor(market.total_volume).toLocaleString()}</span>
              <span className="text-white/30">Tap to trade →</span>
            </div>

            {/* User's position summary (inline) */}
            {hasPosition && (
              <div className="mt-2 pt-2 border-t border-white/5 flex gap-2">
                {yesPos && yesPos.shares_owned > 0 && (
                  <PositionBadge
                    outcome="yes"
                    shares={yesPos.shares_owned}
                    totalPaid={yesPos.total_paid}
                    currentPrice={market.yes_price}
                  />
                )}
                {noPos && noPos.shares_owned > 0 && (
                  <PositionBadge
                    outcome="no"
                    shares={noPos.shares_owned}
                    totalPaid={noPos.total_paid}
                    currentPrice={market.no_price}
                  />
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* ── My Bets Section ── */}
      {positions.filter((p) => {
        if (p.shares_owned <= 0) return false;
        const m = markets.find((mk) => mk.id === p.market_id);
        return m && !m.outcome;
      }).length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 mt-4">
            <span className="text-white/40 text-xs font-semibold tracking-widest uppercase">
              My Bets
            </span>
          </div>

          {positions
            .filter((p) => {
              if (p.shares_owned <= 0) return false;
              const m = markets.find((mk) => mk.id === p.market_id);
              return m && !m.outcome; // hide resolved
            })
            .map((pos) => {
              const market = markets.find((m) => m.id === pos.market_id);
              if (!market) return null;
              const currentPrice = pos.outcome === "yes" ? market.yes_price : market.no_price;
              const avgCost = pos.total_paid / pos.shares_owned;
              const currentValue = pos.shares_owned * currentPrice;
              const pnl = currentValue - pos.total_paid;
              const pnlPct = pos.total_paid > 0 ? (pnl / pos.total_paid) * 100 : 0;

              return (
                <motion.div
                  key={pos.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openDrawer(market)}
                  className="glass rounded-xl p-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-xs font-medium line-clamp-1 flex-1 mr-2">
                      {market.question}
                    </span>
                    <span
                      className={`text-[10px] font-bold tracking-wider ${
                        pos.outcome === "yes" ? "text-neon-green" : "text-neon-pink"
                      }`}
                    >
                      {pos.outcome?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/30">
                      {Math.floor(pos.shares_owned).toLocaleString()} shares · {(avgCost * 100).toFixed(3)}¢ avg
                    </span>
                    <span
                      className={`font-mono font-semibold ${
                        pnl >= 0 ? "text-neon-green" : "text-red-400"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}${Math.floor(pnl).toLocaleString()} ({pnlPct >= 0 ? "+" : ""}
                      {pnlPct.toFixed(0)}%)
                    </span>
                  </div>
                </motion.div>
              );
            })}
        </>
      )}

      {/* ── Resolved Markets ── */}
      {resolvedMarkets.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-1 mt-4">
            <span className="text-white/30 text-xs font-semibold tracking-widest uppercase">
              Resolved Markets
            </span>
          </div>

          {resolvedMarkets.map((market) => {
            const yesPos = getPosition(market.id, "yes");
            const noPos = getPosition(market.id, "no");
            const won =
              (market.outcome === "yes" && yesPos && yesPos.shares_owned > 0) ||
              (market.outcome === "no" && noPos && noPos.shares_owned > 0);
            const winningShares =
              market.outcome === "yes"
                ? yesPos?.shares_owned ?? 0
                : noPos?.shares_owned ?? 0;

            return (
              <div
                key={market.id}
                className="glass rounded-2xl p-4 opacity-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white/50 font-semibold text-sm flex-1 mr-2 leading-snug">
                    {market.question}
                  </h3>
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

                {won && winningShares > 0 && (
                  <p className="text-[11px] text-neon-green/70">
                    You won ${Math.floor(winningShares).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Betting Drawer */}
      <BettingDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        market={selectedMarket}
        yesPosition={drawerYesPos}
        noPosition={drawerNoPos}
      />
    </div>
  );
}

// ─── Inline position badge ───
function PositionBadge({
  outcome,
  shares,
  totalPaid,
  currentPrice,
}: {
  outcome: string;
  shares: number;
  totalPaid: number;
  currentPrice: number;
}) {
  const avgCost = totalPaid / shares;
  const pnl = shares * currentPrice - totalPaid;
  const isYes = outcome === "yes";

  return (
    <div
      className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] flex items-center justify-between ${
        isYes ? "bg-neon-green/5 border border-neon-green/10" : "bg-neon-pink/5 border border-neon-pink/10"
      }`}
    >
      <span className={isYes ? "text-neon-green/70" : "text-neon-pink/70"}>
        {Math.floor(shares).toLocaleString()} @ {(avgCost * 100).toFixed(3)}¢
      </span>
      <span
        className={`font-mono font-semibold ${pnl >= 0 ? "text-neon-green/70" : "text-red-400/70"}`}
      >
        {pnl >= 0 ? "+" : ""}${Math.floor(pnl).toLocaleString()}
      </span>
    </div>
  );
}
