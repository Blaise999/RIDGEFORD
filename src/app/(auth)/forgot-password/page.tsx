"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      try {
        sessionStorage.setItem("crst_reset_email", email);
      } catch {
        /* private-mode WebViews throw on storage access */
      }
      router.push("/forgot-password/verify");
    } finally {
      setLoading(false);
    }
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
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="mt-10">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 grid place-items-center text-brand-600">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-ink-900">
            Reset your password
          </h1>
          <p className="mt-2 text-[14.5px] text-ink-500">
            Enter the email on your account and we'll send a 6-digit code so you can set a new password.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[12.5px] font-semibold text-ink-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </label>

            <button type="submit" disabled={loading} className="btn btn-brand w-full disabled:opacity-70">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Send reset code
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
