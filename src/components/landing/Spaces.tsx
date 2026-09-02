"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Percent, Target, Lock } from "lucide-react";

const SPACES = [
  { name: "Holiday · Lisbon",  emoji: "🏖️", saved: "1.240 €", goal: "2.000 €", pct: 62, tint: "from-amber-100 to-white" },
  { name: "MacBook Pro",       emoji: "💻", saved: "820 €",   goal: "2.400 €", pct: 34, tint: "from-sky-100 to-white" },
  { name: "Emergency fund",    emoji: "☔️", saved: "3.100 €", goal: "5.000 €", pct: 62, tint: "from-brand-100 to-white" },
  { name: "Wedding",           emoji: "💍", saved: "480 €",   goal: "4.000 €", pct: 12, tint: "from-pink-100 to-white" },
  { name: "Gaming setup",      emoji: "🎮", saved: "270 €",   goal: "1.500 €", pct: 18, tint: "from-purple-100 to-white" },
  { name: "Mom's birthday",    emoji: "🎁", saved: "140 €",   goal: "300 €",   pct: 47, tint: "from-rose-100 to-white" },
];

const PILLARS = [
  {
    Icon: Percent,
    title: "2,26 % interest p.a.",
    body: "On every euro in every Space, paid monthly. No lock-in, no minimums.",
  },
  {
    Icon: Target,
    title: "Up to 10 Spaces",
    body: "One for holidays, one for rent, one for that thing you've been eyeing up.",
  },
  {
    Icon: Lock,
    title: "Locked Spaces",
    body: "Feeling tempted? Lock a Space and we'll hold your willpower for you.",
  },
];

export function Spaces() {
  return (
    <section id="spaces" className="py-24 sm:py-28 bg-ink-50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Spaces
            </p>
            <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
              Put every euro in the right pocket.
            </h2>
            <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
              Spaces are sub-accounts inside your main balance. Create one for a goal, set a target, and watch it grow. Earn interest on every single one.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {PILLARS.map(({ Icon, title, body }) => (
                <div key={title} className="rounded-2xl bg-panel border border-ink-100 p-5">
                  <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 grid place-items-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-3 text-[15px] font-semibold text-ink-900">{title}</div>
                  <div className="mt-1 text-[13px] text-ink-500 leading-snug">{body}</div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link href="/signup" className="btn btn-primary focus-ring group">
                Open a Space
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {SPACES.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-2xl bg-gradient-to-br ${s.tint} border border-white p-4 shadow-card`}
                >
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-panel grid place-items-center text-[18px] shadow-sm">
                      {s.emoji}
                    </div>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">
                      of {s.goal}
                    </div>
                  </div>
                  <div className="mt-3 text-[14px] font-semibold text-ink-900 leading-tight">
                    {s.name}
                  </div>
                  <div className="mt-1 text-[20px] font-bold text-ink-900 tracking-tight">{s.saved}</div>
                  <div className="mt-3 h-1.5 rounded-full bg-panel/80 overflow-hidden">
                    <motion.span
                      className="block h-full bg-night-900 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
