"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const STATS = [
  { value: 8_100_000, suffix: "+", label: "Customers trusting us with their money" },
  { value: 36, suffix: "", label: "Countries in our SEPA network" },
  { value: 24, suffix: "", label: "Currencies accepted, fee-free abroad" },
  { value: 98, suffix: "%", label: "Customer satisfaction (2025 NPS)" },
];

export function Stats() {
  return (
    <section className="py-24 sm:py-28 bg-ink-50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            By the numbers
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
            Not just a nice idea. Proof.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-panel border border-ink-100 p-6"
            >
              <div className="text-[40px] sm:text-[48px] font-bold tracking-tight text-ink-900 leading-none">
                <Counter value={s.value} />
                <span className="text-brand-600">{s.suffix}</span>
              </div>
              <div className="mt-3 text-[14px] text-ink-500 leading-snug">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1600, bounce: 0 });
  const rounded = useTransform(spring, (latest) => {
    const n = Math.round(latest);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " Mio.";
    if (n >= 10_000) return new Intl.NumberFormat("de-DE").format(n);
    return String(n);
  });

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, mv, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
