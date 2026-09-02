"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "same-origin",
      });

      const raw = await r.text();
      let d: any = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!r.ok || !d.ok) throw new Error(d.error || "Login failed");

      // Hard navigation — see /login/verify for the full explanation. The
      // admin-login API just Set-Cookie'd; router.push + refresh can race
      // the cookie commit and trigger the white-screen error.
      if (typeof window !== "undefined") {
        window.location.assign("/admin");
        return;
      }
      router.push("/admin");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-night-900 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }} />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md mx-5 rounded-3xl bg-panel p-10 shadow-pop"
      >
        <div className="flex items-center gap-3">
          <Logo />
          <span className="inline-flex items-center gap-1 rounded-full bg-night-900 text-white text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5">
            Admin
          </span>
        </div>

        <h1 className="mt-6 text-[28px] font-bold tracking-tight">Admin console</h1>
        <p className="mt-1 text-[14px] text-ink-500">Restricted access. All actions are logged.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            />
          </label>

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
              {err}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full focus-ring">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Enter admin console
          </button>
        </form>

        <p className="mt-5 text-[12px] text-ink-400 text-center">
          Demo credentials: <span className="font-mono">admin@ridgefordbank.eu</span> / <span className="font-mono">Admin123!</span>
        </p>
      </motion.div>
    </div>
  );
}
