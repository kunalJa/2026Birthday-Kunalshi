"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Send, AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserProvider";

interface SendMoneyModalProps {
  open: boolean;
  onClose: () => void;
}

interface RecipientResult {
  id: string;
  username: string;
}

interface LocationOption {
  id: string;
  name: string;
}

type Step = "form" | "confirm" | "sending" | "success" | "error";

export default function SendMoneyModal({ open, onClose }: SendMoneyModalProps) {
  const { user, profile, refreshProfile } = useUser();
  const [step, setStep] = useState<Step>("form");

  // Form state
  const [recipientQuery, setRecipientQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientResult | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [searching, setSearching] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch locations for current phase only
  useEffect(() => {
    async function loadLocations() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: settingData } = await (supabase.from("game_settings") as any)
        .select("value")
        .eq("key", "map_phase")
        .single();
      const phase = settingData?.value ? parseInt(settingData.value, 10) : 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("map_locations") as any)
        .select("id, name")
        .eq("is_active", true)
        .eq("phase", phase)
        .order("name");
      if (data) setLocations(data as LocationOption[]);
    }
    loadLocations();
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("form");
      setRecipientQuery("");
      setSearchResults([]);
      setSelectedRecipient(null);
      setAmount("");
      setMessage("");
      setLocationId("");
      setErrorMsg("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Debounced user search
  useEffect(() => {
    if (!recipientQuery.trim() || selectedRecipient) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("profiles") as any)
        .select("id, username")
        .ilike("username", `%${recipientQuery.trim()}%`)
        .neq("id", user?.id ?? "")
        .limit(5);

      if (data) setSearchResults(data as RecipientResult[]);
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [recipientQuery, selectedRecipient, user?.id]);

  const parsedAmount = Math.round(Number(amount) * 100) / 100; // allow 2 decimals
  const balance = profile?.balance ?? 0;

  const canSubmit =
    selectedRecipient &&
    parsedAmount > 0 &&
    parsedAmount <= balance;

  function handleSelectRecipient(r: RecipientResult) {
    setSelectedRecipient(r);
    setRecipientQuery(r.username);
    setSearchResults([]);
  }

  function handleClearRecipient() {
    setSelectedRecipient(null);
    setRecipientQuery("");
  }

  function handleReview() {
    if (!canSubmit) return;
    setErrorMsg("");
    setStep("confirm");
  }

  async function handleSend() {
    if (!user || !selectedRecipient) return;
    setStep("sending");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)("send_money", {
      p_sender_id: user.id,
      p_receiver_id: selectedRecipient.id,
      p_amount: parsedAmount,
      p_message: message.trim() || null,
      p_location_id: locationId || null,
    });

    if (error) {
      setErrorMsg(error.message || "Transaction failed");
      setStep("error");
      return;
    }

    await refreshProfile();
    setStep("success");
  }

  function handleClose() {
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="send-money-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          key="send-money-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-strong rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-wide">Send Money</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="glass rounded-full h-9 w-9 flex items-center justify-center"
            >
              <X size={18} className="text-white/60" />
            </motion.button>
          </div>

          {/* Balance display */}
          <div className="text-center">
            <span className="text-3xl font-bold text-white text-glow-gold">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-white/30 mt-1">Available Balance</p>
          </div>

          {/* ── FORM STEP ── */}
          {step === "form" && (
            <div className="flex flex-col gap-3">
              {/* Recipient input */}
              <div className="relative">
                <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                  Send To
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={recipientQuery}
                    onChange={(e) => {
                      setRecipientQuery(e.target.value);
                      if (selectedRecipient) handleClearRecipient();
                    }}
                    placeholder="Search username..."
                    className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-green/30"
                  />
                  {selectedRecipient && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearRecipient}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && !selectedRecipient && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 glass-strong rounded-xl overflow-hidden">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRecipient(r)}
                        className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <span className="text-neon-green font-semibold">@</span>
                        {r.username}
                      </button>
                    ))}
                  </div>
                )}

                {searching && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-10 glass-strong rounded-xl px-4 py-3">
                    <Loader2 size={14} className="animate-spin text-white/30" />
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div>
                <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green font-bold text-lg">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min={1}
                    max={balance}
                    className="w-full glass rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {parsedAmount > balance && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Insufficient balance
                  </p>
                )}
              </div>

              {/* Message (optional) */}
              <div>
                <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                  Message <span className="text-white/20">(optional)</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's it for?"
                  maxLength={100}
                  className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-green/30"
                />
              </div>

              {/* Location (optional) */}
              {locations.length > 0 && (
                <div>
                  <label className="text-[11px] text-white/40 font-semibold tracking-widest uppercase mb-1 block">
                    <MapPin size={10} className="inline mr-1" />
                    Location <span className="text-white/20">(optional)</span>
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-neon-green/30 bg-transparent [&>option]:bg-zinc-900 [&>option]:text-white"
                  >
                    <option value="">None</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                onClick={handleReview}
                disabled={!canSubmit}
                className={`w-full rounded-2xl py-3.5 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                  canSubmit
                    ? "bg-neon-green/20 text-neon-green border border-neon-green/30 hover:glow-green"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                <Send size={16} strokeWidth={2.5} />
                {canSubmit
                  ? `Send $${parsedAmount.toFixed(2)}`
                  : "Send Money"}
              </motion.button>
            </div>
          )}

          {/* ── CONFIRM STEP ── */}
          {step === "confirm" && selectedRecipient && (
            <div className="flex flex-col gap-4 items-center">
              <div className="glass-strong rounded-2xl p-5 w-full text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Confirm Transfer</p>
                <p className="text-3xl font-bold text-neon-green text-glow-green">
                  ${parsedAmount.toFixed(2)}
                </p>
                <p className="text-sm text-white/60 mt-2">
                  to <span className="text-white font-semibold">@{selectedRecipient.username}</span>
                </p>
                {message && (
                  <p className="text-xs text-white/30 mt-2 italic">&ldquo;{message}&rdquo;</p>
                )}
                {locationId && (
                  <p className="text-xs text-white/30 mt-1 flex items-center justify-center gap-1">
                    <MapPin size={10} /> {locations.find((l) => l.id === locationId)?.name}
                  </p>
                )}
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
                  onClick={handleSend}
                  className="flex-1 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-2xl py-3 text-sm font-bold hover:glow-green"
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          )}

          {/* ── SENDING STEP ── */}
          {step === "sending" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="animate-spin text-neon-green" />
              <p className="text-sm text-white/40">Processing transfer...</p>
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
              <p className="text-lg font-bold text-white">Sent!</p>
              <p className="text-sm text-white/40 text-center">
                ${parsedAmount.toFixed(2)} sent to @{selectedRecipient?.username}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
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
              <p className="text-lg font-bold text-white">Failed</p>
              <p className="text-sm text-red-400/80 text-center">{errorMsg}</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("form")}
                  className="glass-strong rounded-2xl px-8 py-3 text-sm font-semibold text-white/70"
                >
                  Try Again
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
