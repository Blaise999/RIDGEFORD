"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/landing/Logo";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function LoginVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // sessionStorage may be unavailable in private-mode WebViews on some
    // mobile browsers — guard it so we don't crash the verify page itself.
    try {
      const e = sessionStorage.getItem("rdgf_login_email");
      const m = sessionStorage.getItem("rdgf_login_email_masked");
      if (!e) {
        router.replace("/login");
        return;
      }
      setEmail(e);
      if (m) setMasked(m);
    } catch {
      router.replace("/login");
      return;
    }
    inputs.current[0]?.focus();
  }, [router]);

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d) && !loading) {
      void submitCode(next.join(""));
    }
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setCode(next);
    if (text.length === 6) void submitCode(text);
    else inputs.current[text.length]?.focus();
  }

  async function submitCode(c: string) {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code: c }),
        // Important: include credentials so the Set-Cookie from the response
        // is honored and attached to subsequent requests in the same origin.
        credentials: "same-origin",
      });

      // Read body as text first so a non-JSON 500 doesn't itself throw.
      const raw = await r.text();
      let d: any = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!r.ok || !d.ok) {
        throw new Error(d.error || "Invalid code");
      }

      try {
        sessionStorage.removeItem("rdgf_login_email");
        sessionStorage.removeItem("rdgf_login_email_masked");
      } catch {
        /* ignore */
      }

      const target = d.redirect || "/dashboard";

      // CRITICAL FIX:
      // Previously this used `router.push(target); router.refresh();`. In
      // Next 14 App Router, that pair starts a *soft* RSC navigation
      // immediately after the response — which can race the browser
      // committing the Set-Cookie header from the same response. When the
      // race is lost (slow networks, certain regions, strict cookie
      // policies), the server-rendered dashboard layout sees no session,
      // calls redirect("/login") mid-navigation, and the unhandled
      // NEXT_REDIRECT surfaces in the browser as
      // "Application error: a client-side exception has occurred".
      //
      // A hard navigation (`window.location.assign`) makes the browser
      // issue a brand-new top-level request *after* the cookie is in the
      // jar, eliminating the race entirely.
      if (typeof window !== "undefined") {
        window.location.assign(target);
      } else {
        // SSR safety — should never run for this code path.
        router.replace(target);
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setCode(Array(6).fill(""));
      inputs.current[0]?.focus();
      setLoading(false);
    }
  }

  async function resend() {
    setErr(null);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "__resend__" }),
      });
    } catch {
      /* ignore — UX is "we tried" */
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-ink-900">
            Enter your sign-in code
          </h1>
          <p className="mt-2 text-[14.5px] text-ink-500">
            We emailed a 6-digit code to <span className="font-semibold text-ink-900">{masked || email}</span>.
            Enter it below to finish signing in.
          </p>

          <div className="mt-6 flex gap-2 justify-between">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onPaste={handlePaste}
                className="h-14 w-full max-w-[56px] rounded-xl border border-ink-200 bg-panel text-center text-[22px] font-bold text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              />
            ))}
          </div>

          {err && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
              {err}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between text-[13px]">
            <button onClick={resend} className="text-brand-600 font-semibold hover:underline" type="button">
              Resend code
            </button>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…
              </span>
            )}
          </div>

          <div className="mt-8 rounded-xl bg-ink-50 border border-ink-100 p-3 text-[12px] text-ink-500">
            Didn&apos;t get a code? <span className="font-mono text-ink-900">Try Again</span>.
            Check spam folder
          </div>
        </div>
      </motion.div>
    </div>
  );
}
