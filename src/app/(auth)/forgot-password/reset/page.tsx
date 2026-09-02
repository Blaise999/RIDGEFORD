"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";

export default function ForgotResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmP, setConfirmP] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const e = sessionStorage.getItem("crst_reset_email");
      const c = sessionStorage.getItem("crst_reset_code");
      if (!e || !c) {
        router.replace("/forgot-password");
        return;
      }
      setEmail(e);
      setCode(c);
    } catch {
      router.replace("/forgot-password");
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters");
    if (password !== confirmP) return setErr("Passwords don't match");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, password }),
        credentials: "same-origin",
      });

      const raw = await r.text();
      let d: any = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!r.ok || !d.ok) throw new Error(d.error || "Reset failed");

      try {
        sessionStorage.removeItem("crst_reset_email");
        sessionStorage.removeItem("crst_reset_code");
      } catch {
        /* ignore */
      }

      setDone(true);
      // Hard navigation for the same reason as login/verify — guarantees the
      // login page sees a clean session state.
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        } else {
          router.push("/login");
        }
      }, 1600);
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-panel">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="h-14 w-14 mx-auto rounded-full bg-brand-500/10 grid place-items-center text-brand-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-[24px] font-bold text-ink-900">Password updated</h1>
          <p className="mt-2 text-[14px] text-ink-500">Redirecting you to sign in…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10 bg-panel">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-[13px] text-ink-500 hover:text-ink-900 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Sign in
          </Link>
        </div>

        <div className="mt-10">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 grid place-items-center text-brand-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-ink-900">
            Set a new password
          </h1>
          <p className="mt-2 text-[14.5px] text-ink-500">
            Choose a strong password with at least 8 characters.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[12.5px] font-semibold text-ink-700">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block">
              <span className="text-[12.5px] font-semibold text-ink-700">Confirm password</span>
              <input
                type="password"
                value={confirmP}
                onChange={(e) => setConfirmP(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </label>

            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
                {err}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-brand w-full disabled:opacity-70">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Update password
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
