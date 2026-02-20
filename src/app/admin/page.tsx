"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useUser } from "@/context/UserProvider";
import AdminTab from "@/components/tabs/AdminTab";
import Link from "next/link";

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Check if already authenticated in session
  useEffect(() => {
    const auth = sessionStorage.getItem("admin-auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Require user to be logged in first
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-neon-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access</h1>
          <p className="text-white/60 mb-6">Please log in first to access admin panel</p>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-strong rounded-2xl px-6 py-3 text-neon-green font-semibold"
            >
              Back to Home
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // Password verification
  const handleUnlock = async () => {
    setChecking(true);
    setError("");

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === "kavya") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-auth", "true");
    } else {
      setError("Incorrect password");
      setPassword("");
    }

    setChecking(false);
  };

  // Lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="inline-flex items-center justify-center glass rounded-full h-10 w-10 mb-4"
              >
                <ArrowLeft size={18} className="text-white/60" />
              </motion.div>
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock size={24} className="text-neon-pink" />
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-sm text-white/40">Enter password to continue</p>
          </div>

          {/* Password Form */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full glass rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-neon-pink/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password.trim()) {
                    handleUnlock();
                  }
                }}
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </motion.button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm mb-4"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileHover={password.trim() ? { scale: 1.02 } : {}}
              whileTap={password.trim() ? { scale: 0.98 } : {}}
              onClick={handleUnlock}
              disabled={!password.trim() || checking}
              className={`w-full rounded-2xl py-3 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                password.trim()
                  ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:glow-pink"
                  : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
              }`}
            >
              {checking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} strokeWidth={2.5} />
              )}
              {checking ? "Verifying..." : "Unlock"}
            </motion.button>
          </div>

          <p className="text-xs text-white/20 text-center mt-6">
            Session will remain active until you close the tab
          </p>
        </motion.div>
      </div>
    );
  }

  // Admin content (reuses the existing AdminTab component)
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="glass rounded-full h-10 w-10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </motion.div>
        </Link>
      </div>
      
      <div className="pt-16">
        <AdminTab />
      </div>
    </div>
  );
}
