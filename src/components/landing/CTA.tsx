"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] bg-night-900 text-white p-10 sm:p-14 lg:p-20"
        >
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -top-20 -right-10 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-300">
              Your turn
            </p>
            <h2 className="mt-2 text-[40px] sm:text-[58px] leading-[1.04] font-bold tracking-tight">
              Ready when you are.
            </h2>
            <p className="mt-4 text-[17px] sm:text-[19px] text-white/70 leading-relaxed">
              Open your Ridgeford Capital Bank account in 8 minutes. No paperwork, no queues, no monthly fee unless you want one.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="btn bg-panel text-ink-900 hover:bg-ink-50 focus-ring group"
              >
                Open an account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="btn border border-white/20 text-white hover:bg-white/10 focus-ring"
              >
                I already have one
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
