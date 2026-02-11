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

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // ─── Helper: fetch locations for a given phase ───
  async function fetchLocations(phase: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("map_locations") as any)
      .select("*")
      .eq("is_active", true)
      .lte("phase", phase)
      .order("phase", { ascending: true });
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
        .select("id, sender_id, amount, message, location_id, profiles!transactions_sender_id_fkey(username)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentTx) {
        const items: FeedItem[] = (recentTx as Array<{
          id: string;
          sender_id: string | null;
          amount: number | null;
          message: string | null;
          location_id: string | null;
          profiles: { username: string } | null;
        }>).map((tx) => {
          const name = tx.profiles?.username ?? "Someone";
          const amt = tx.amount ?? 0;
          const text = tx.message
            ? `${name} — $${amt.toLocaleString()} "${tx.message}"`
            : `${name} sent $${amt.toLocaleString()}`;
          return { id: tx.id, text, timestamp: Date.now() };
        });
        setFeedItems(items);
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Realtime: map settings + markers + transactions (single channel) ───
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`map-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_settings",
          filter: "key=eq.map_phase",
        },
        (payload) => {
          const newPhase = parseInt((payload.new as { value: string }).value, 10);
          setMapPhase(newPhase);
          fetchLocations(newPhase);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_locations",
        },
        () => {
          fetchLocations(mapPhase);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        async (payload) => {
          const tx = payload.new as {
            id: string;
            sender_id: string | null;
            amount: number | null;
            message: string | null;
            location_id: string | null;
          };

          // Resolve sender name
          let senderName = "Someone";
          if (tx.sender_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile } = await (supabase.from("profiles") as any)
              .select("username")
              .eq("id", tx.sender_id)
              .single();
            if (profile?.username) senderName = profile.username;
          }

          const amt = tx.amount ?? 0;
          const text = tx.message
            ? `${senderName} — $${amt.toLocaleString()} "${tx.message}"`
            : `${senderName} sent $${amt.toLocaleString()}`;

          // Add to feed
          const feedItem: FeedItem = { id: tx.id, text, timestamp: Date.now() };
          setFeedItems((prev) => [feedItem, ...prev].slice(0, 20));

          // If tagged with a location, show a map toast
          if (tx.location_id) {
            const loc = locationsRef.current.find((l) => l.id === tx.location_id);
            if (loc) {
              const toast: ActiveToast = {
                id: tx.id,
                x: loc.x_pct,
                y: loc.y_pct,
                text,
              };
              setMapToasts((prev) => [toast, ...prev].slice(0, 6));
              setTimeout(() => {
                setMapToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }, 5000);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("[map-realtime] status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, mapPhase]);

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
      <div className="relative flex-1 min-h-0">
        {/* Phase badge */}
        <div className="absolute top-3 left-3 z-30 glass-strong rounded-xl px-3 py-1.5">
          <span className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">
            Phase {mapPhase}
          </span>
        </div>

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
            <img
              src={PHASE_IMAGES[mapPhase] ?? PHASE_IMAGES[1]}
              alt={`Floor plan phase ${mapPhase}`}
              className="w-full h-auto select-none pointer-events-none brightness-90 invert opacity-80"
              draggable={false}
            />

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

      {/* ── Live Feed Strip ── */}
      <div className="shrink-0 border-t border-white/5 bg-black/40 backdrop-blur-sm">
        <TransactionFeed items={feedItems} />
      </div>
    </div>
  );
}
