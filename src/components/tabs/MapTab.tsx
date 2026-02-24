"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserProvider";
import type { MapLocation } from "@/lib/types";
import MapMarker from "@/components/map/MapMarker";
import MapToast from "@/components/map/MapToast";
import TransactionFeed, { type FeedItem } from "@/components/map/TransactionTicker";
import { Loader2 } from "lucide-react";

const PHASE_IMAGES: Record<number, string> = {
  1: "/map_phase1.png",
  2: "/map_phase2.jpg",
};

interface ActiveToast {
  id: string;
  x: number;
  y: number;
  text: string;
}

export default function MapTab() {
  const { user } = useUser();
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [mapPhase, setMapPhase] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [mapToasts, setMapToasts] = useState<ActiveToast[]>([]);
  const locationsRef = useRef<MapLocation[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [devCoord, setDevCoord] = useState<{ x: number; y: number } | null>(null);
  const [devCopied, setDevCopied] = useState(false);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // ─── Helper: fetch locations for a given phase ───
  async function fetchLocations(phase: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("map_locations") as any)
      .select("*")
      .eq("is_active", true)
      .eq("phase", phase);
    if (data) setLocations(data as MapLocation[]);
  }

  // ─── Fetch initial data on mount ───
  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: settingData } = await (supabase.from("game_settings") as any)
        .select("value")
        .eq("key", "map_phase")
        .single();

      const phase = settingData?.value ? parseInt(settingData.value, 10) : 1;
      setMapPhase(phase);
      await fetchLocations(phase);

      // Fetch recent transactions for initial feed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recentTx } = await (supabase.from("transactions") as any)
        .select("id, sender_id, receiver_id, amount, message, location_id, sender:profiles!transactions_sender_id_fkey(username), receiver:profiles!transactions_receiver_id_fkey(username)")
        .order("created_at", { ascending: false })
        .limit(40);

      if (recentTx) {
        const items: FeedItem[] = (recentTx as Array<{
          id: string;
          sender_id: string | null;
          receiver_id: string | null;
          amount: number | null;
          message: string | null;
          location_id: string | null;
          sender: { username: string } | null;
          receiver: { username: string } | null;
        }>).map((tx) => {
          seenTxIds.current.add(tx.id);
          const from = tx.sender?.username ?? "Someone";
          const amt = tx.amount ?? 0;
          let text: string;
          if (!tx.receiver_id && tx.message) {
            text = `${from} — ${tx.message}`;
          } else {
            const to = tx.receiver?.username ?? "Someone";
            text = tx.message
              ? `${from} → ${to} — $${amt.toLocaleString()} "${tx.message}"`
              : `${from} → ${to} — $${amt.toLocaleString()}`;
          }
          return { id: tx.id, text, timestamp: Date.now() };
        });
        setFeedItems(items);
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Poll transactions every 3s (realtime unreliable on this table) ───
  const seenTxIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user?.id) return;

    const poll = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from("transactions") as any)
        .select("id, sender_id, receiver_id, amount, message, location_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!rows || rows.length === 0) return;

      const newRows = (rows as Array<{
        id: string;
        sender_id: string | null;
        receiver_id: string | null;
        amount: number | null;
        message: string | null;
        location_id: string | null;
        created_at: string;
      }>).filter((r) => !seenTxIds.current.has(r.id));

      if (newRows.length === 0) return;

      // Process each new transaction
      const newItems: FeedItem[] = [];
      for (const tx of newRows) {
        seenTxIds.current.add(tx.id);

        let senderName = "Someone";
        if (tx.sender_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: prof } = await (supabase.from("profiles") as any)
            .select("username")
            .eq("id", tx.sender_id)
            .single();
          if (prof?.username) senderName = prof.username;
        }

        let receiverName = "Someone";
        if (tx.receiver_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: prof } = await (supabase.from("profiles") as any)
            .select("username")
            .eq("id", tx.receiver_id)
            .single();
          if (prof?.username) receiverName = prof.username;
        }

        const amt = tx.amount ?? 0;
        let text: string;
        if (!tx.receiver_id && tx.message) {
          text = `${senderName} — ${tx.message}`;
        } else {
          text = tx.message
            ? `${senderName} → ${receiverName} — $${amt.toLocaleString()} "${tx.message}"`
            : `${senderName} → ${receiverName} — $${amt.toLocaleString()}`;
        }

        newItems.push({ id: tx.id, text, timestamp: Date.now() });

        // Map toast for location-tagged transactions
        if (tx.location_id) {
          const loc = locationsRef.current.find((l) => l.id === tx.location_id);
          if (loc) {
            const toast: ActiveToast = { id: tx.id, x: loc.x_pct, y: loc.y_pct, text };
            setMapToasts((prev) => [toast, ...prev].slice(0, 6));
            setTimeout(() => {
              setMapToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 5000);
          }
        }
      }

      if (newItems.length > 0) {
        setFeedItems((prev) => [...newItems, ...prev].slice(0, 20));
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -mx-4 -mt-4">
      {/* ── Map Area ── */}
      <div className="relative h-[55%]">
        <TransformWrapper
          minScale={1}
          maxScale={4}
          initialScale={1}
          centerOnInit
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", position: "relative" }}
          >
            <div className="relative w-full">
              <img
                src={PHASE_IMAGES[mapPhase] ?? PHASE_IMAGES[1]}
                alt={`Floor plan phase ${mapPhase}`}
                className="w-full h-auto select-none pointer-events-none brightness-90 invert opacity-80"
                draggable={false}
              />
              {/* Dev mode: click overlay to capture coordinates */}
              {devMode && (
                <div
                  className="absolute inset-0 z-50 cursor-crosshair"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                    const coord = { x: Math.round(xPct * 100) / 100, y: Math.round(yPct * 100) / 100 };
                    setDevCoord(coord);
                    navigator.clipboard.writeText(`x_pct: ${coord.x}, y_pct: ${coord.y}`);
                    setDevCopied(true);
                    setTimeout(() => setDevCopied(false), 1500);
                  }}
                />
              )}
              {/* Dev mode: show clicked coordinate marker */}
              {devMode && devCoord && (
                <div
                  className="absolute z-[60] pointer-events-none"
                  style={{ left: `${devCoord.x}%`, top: `${devCoord.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className="h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
                </div>
              )}
            </div>

            {/* Permanent markers */}
            {locations.map((loc) => (
              <MapMarker
                key={loc.id}
                x={loc.x_pct}
                y={loc.y_pct}
                emoji={loc.emoji}
                label={loc.name}
                description={loc.description}
              />
            ))}

            {/* Ephemeral transaction toasts pinned to locations */}
            <AnimatePresence>
              {mapToasts.map((toast) => (
                <MapToast
                  key={toast.id}
                  x={toast.x}
                  y={toast.y}
                  text={toast.text}
                />
              ))}
            </AnimatePresence>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Dev mode toggle + coordinate display */}
      {devMode && devCoord && (
        <div className="shrink-0 bg-black/80 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <span className="text-neon-green">
            x_pct: {devCoord.x}, y_pct: {devCoord.y}
          </span>
          <span className="text-white/40">
            {devCopied ? "Copied!" : "Click map to get coords"}
          </span>
        </div>
      )}
      {/* DEV MODE TOGGLE — uncomment to enable coordinate picker
      <button
        onClick={() => { setDevMode((v) => !v); setDevCoord(null); }}
        className="absolute top-2 right-2 z-50 glass rounded-lg px-2 py-1 text-[10px] font-mono text-white/30 hover:text-white/60"
      >
        {devMode ? "✕ Dev" : "📍 Dev"}
      </button>
      */}

      {/* ── Live Feed Strip ── */}
      <div className="shrink-0 border-t border-white/5 bg-black/40 backdrop-blur-sm mb-16">
        <TransactionFeed items={feedItems} />
      </div>
    </div>
  );
}
