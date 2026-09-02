"use client";

import { motion } from "framer-motion";

const METRICS = [
  { k: "8 Mio.+", v: "Customers across Europe" },
  { k: "36", v: "Countries covered by SEPA" },
  { k: "100.000 €", v: "Deposit protection" },
  { k: "2,26 %", v: "Interest on Spaces, p.a." },
];

export function MetricsBar() {
  return (
    <section className="border-y border-ink-100 bg-panel">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.k}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-ink-900 leading-none">
                {m.k}
              </div>
              <div className="mt-2 text-[13.5px] text-ink-500 leading-snug">{m.v}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
