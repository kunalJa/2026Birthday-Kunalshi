"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/context/UserProvider";
import { Loader2 } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const { signIn, signUp } = useUser();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === "signin") {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      if (!username.trim()) {
        setError("Username is required");
        setSubmitting(false);
        return;
      }
      const { error: err } = await signUp(email, password, username.trim());
      if (err) {
        setError(err);
      } else {
        setSignupSuccess(true);
      }
    }

    setSubmitting(false);
  };

  if (signupSuccess) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="text-6xl">✉️</div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="text-white/50 text-sm max-w-xs">
            We sent a confirmation link to <span className="text-neon-green font-medium">{email}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => {
              setSignupSuccess(false);
              setMode("signin");
            }}
            className="text-white/40 text-sm underline underline-offset-4 hover:text-white/60 transition-colors"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 px-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-neon-orange/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-neon-pink/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="text-4xl font-black tracking-tighter text-white"
          >
            ALI + KUNAL <span className="text-neon-gold">2026</span>
          </motion.div>
          <p className="text-white/30 text-sm tracking-widest uppercase">
            The Party Economy
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="glass rounded-2xl p-1 flex w-full">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                mode === m
                  ? "bg-white/10 text-white"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="username"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full glass rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 outline-none focus:border-neon-green/30 transition-colors bg-transparent"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full glass rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 outline-none focus:border-neon-green/30 transition-colors bg-transparent"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full glass rounded-2xl px-5 py-4 text-white text-sm placeholder:text-white/20 outline-none focus:border-neon-green/30 transition-colors bg-transparent"
          />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-neon-pink text-xs text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl py-4 text-sm font-bold tracking-wide bg-gradient-to-r from-neon-green/80 to-neon-green/60 text-black disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin mx-auto" />
            ) : mode === "signin" ? (
              "Enter the Party"
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
