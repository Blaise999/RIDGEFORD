"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
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

      try {
        sessionStorage.setItem("rdgf_login_email", email);
        if (d.emailMasked) sessionStorage.setItem("rdgf_login_email_masked", d.emailMasked);
      } catch {
        /* private-mode browsers throw on storage — verify page handles it */
      }
      router.push("/login/verify");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Client access"
      headline="Sign in to Ridgeford."
      sub="Two-factor authentication is mandatory on every session, as required under PSD2 strong customer authentication."
    >
      <form onSubmit={submit} className="space-y-5">
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13.5px] text-red-300">
            {err}
          </div>
        )}

        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link href="/forgot-password" className="text-[12px] font-semibold text-gold-300 hover:text-gold-200 mb-1.5">
              Forgot it?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              className="field pr-12"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-panel-2 transition"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>

        <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-gold-500 mt-px" />
          We'll email a six-digit code to finish signing in. Ridgeford will never
          ask you for that code by phone or message.
        </p>

        <div className="pt-2 border-t border-ink-100 text-[13.5px] text-ink-500">
          New to Ridgeford?{" "}
          <Link href="/signup" className="font-semibold text-ink-900 hover:text-gold-300">
            Open an account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
