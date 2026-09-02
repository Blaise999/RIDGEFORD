"use client";

import { Logo } from "@/components/landing/Logo";
import { ShieldCheck, Landmark, Lock } from "lucide-react";

/**
 * The dealing-room frame every auth screen sits in: form on the left,
 * a quiet market wall on the right. Deliberately static — no fetches on
 * an unauthenticated screen.
 */
const TAPE = [
  { s: "DAX", p: "18,412,60", c: +0.62 },
  { s: "STOXX 50", p: "4,987,21", c: +0.41 },
  { s: "FTSE 100", p: "8,204,55", c: -0.18 },
  { s: "EUR/USD", p: "1,0871", c: +0.09 },
  { s: "BTC/EUR", p: "92,418", c: +2.14 },
  { s: "ETH/EUR", p: "3,180", c: +1.27 },
  { s: "GOLD", p: "2,318,40", c: +0.33 },
  { s: "BUND 10Y", p: "2,384 %", c: -0.02 },
];

export function AuthShell({
  children,
  eyebrow,
  headline,
  sub,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  headline?: string;
  sub?: string;
}) {
  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      {/* ── form column ─────────────────────────────────────────────── */}
      <div className="flex flex-col min-h-screen">
        <header className="h-16 px-5 sm:px-10 flex items-center justify-between border-b border-ink-100/70">
          <Logo />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            <Lock className="h-3.5 w-3.5 text-gold-400" />
            Secured session
          </span>
        </header>

        <main className="flex-1 px-5 sm:px-10 py-10 sm:py-14">
          <div className="mx-auto w-full max-w-[440px]">
            {eyebrow && (
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400">
                {eyebrow}
              </div>
            )}
            {headline && (
              <h1 className="mt-3 font-display text-[32px] sm:text-[40px] leading-[1.05] tracking-tight text-ink-900">
                {headline}
              </h1>
            )}
            {sub && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-500">{sub}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>

        <footer className="px-5 sm:px-10 py-5 border-t border-ink-100/70 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5 text-ink-400" />
            Ridgeford Capital Bank AG · Frankfurt am Main
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-ink-400" />
            Deposits protected to 100,000 €
          </span>
          <span className="ml-auto">© {new Date().getFullYear()}</span>
        </footer>
      </div>

      {/* ── market wall ─────────────────────────────────────────────── */}
      <aside className="hidden lg:block relative overflow-hidden border-l border-ink-100/70 bg-night-900">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 80% 0%, rgba(201,162,39,0.12), transparent 60%), radial-gradient(700px 500px at 10% 100%, rgba(47,123,255,0.10), transparent 60%)",
          }}
        />
        <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">
              The Ridgeford desk
            </div>
            <h2 className="mt-5 font-display text-[38px] xl:text-[46px] leading-[1.05] tracking-tight text-ink-900 max-w-[13ch]">
              Old-world banking.{" "}
              <span className="text-gold-gradient">New-world markets.</span>
            </h2>
            <p className="mt-5 max-w-[42ch] text-[14.5px] leading-relaxed text-ink-500">
              Euro current and savings accounts, SEPA and SWIFT rails, and a
              regulated digital-asset desk — under one roof, on one balance.
            </p>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-panel/60 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Indicative levels
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                <span className="h-1.5 w-1.5 rounded-full bg-up animate-pulse" />
                Delayed
              </span>
            </div>
            <ul className="divide-y divide-ink-100">
              {TAPE.map((t) => (
                <li key={t.s} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-[12.5px] font-semibold text-ink-700">{t.s}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="text-[13px] font-semibold text-ink-900 tnum">{t.p}</span>
                    <span
                      className={`text-[12px] font-semibold tnum ${t.c >= 0 ? "up" : "down"}`}
                      style={{ minWidth: 56, textAlign: "right" }}
                    >
                      {t.c >= 0 ? "+" : "−"}
                      {Math.abs(t.c).toFixed(2)} %
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
