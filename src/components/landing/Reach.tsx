"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const COUNTRIES = [
  "🇩🇪 Germany", "🇫🇷 France", "🇪🇸 Spain", "🇮🇹 Italy", "🇳🇱 Netherlands",
  "🇧🇪 Belgium", "🇦🇹 Austria", "🇵🇹 Portugal", "🇮🇪 Ireland", "🇫🇮 Finland",
  "🇬🇷 Greece", "🇸🇰 Slovakia", "🇸🇮 Slovenia", "🇱🇺 Luxembourg", "🇲🇹 Malta",
  "🇨🇾 Cyprus", "🇪🇪 Estonia", "🇱🇻 Latvia", "🇱🇹 Lithuania", "🇨🇿 Czechia",
  "🇩🇰 Denmark", "🇸🇪 Sweden", "🇵🇱 Poland", "🇭🇺 Hungary", "🇷🇴 Romania",
  "🇧🇬 Bulgaria", "🇭🇷 Croatia", "🇳🇴 Norway", "🇮🇸 Iceland", "🇨🇭 Switzerland",
  "🇱🇮 Liechtenstein", "🇲🇨 Monaco", "🇸🇲 San Marino", "🇦🇩 Andorra", "🇻🇦 Vatican",
  "🇬🇧 United Kingdom",
];

export function Reach() {
  return (
    <section className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-sky-50/40 to-white" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:radial-gradient(circle_at_50%_50%,black,transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Europe-wide
            </p>
            <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
              One IBAN. <br /> All of Europe.
            </h2>
            <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
              With your German IBAN you can send and receive euros across 36 SEPA countries — as easily as paying the person next to you. SEPA Instant settles in under 10 seconds.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-panel ring-1 ring-ink-100 shadow-card px-4 py-2 text-[13.5px] font-semibold text-ink-900">
              <Zap className="h-4 w-4 text-brand-600" />
              SEPA Instant · free · arrives in ~10 seconds
            </div>

            <div className="mt-8">
              <Link href="/signup" className="btn btn-primary group">
                Get your IBAN
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Countries wall */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[28px] bg-panel border border-ink-100 p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">SEPA coverage</span>
                <span className="text-[12px] text-ink-400">36 countries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.02 * i, duration: 0.35 }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 border border-ink-100 px-3 py-1.5 text-[12.5px] font-medium text-ink-700"
                  >
                    {c}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Connection lines decoration */}
            <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
