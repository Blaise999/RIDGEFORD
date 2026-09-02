"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

type Review = { name: string; role: string; quote: string; avatar: string; stars: number };

const REVIEWS: Review[] = [
  {
    name: "Maren K.",
    role: "Designer · Frankfurt",
    quote:
      "I finally stopped dreading checking my balance. Spaces turned saving into something that kind of feels like a game.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
  {
    name: "Julian R.",
    role: "Freelance developer · Munich",
    quote:
      "Between the auto-VAT Space and the invoice notifications, Ridgeford Capital Bank Business saves me four hours a month in bookkeeping.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
  {
    name: "Sofía M.",
    role: "Consultant · Barcelona",
    quote:
      "SEPA Instant is real. I sent 600 € to my mum in Madrid last week and she called me back before I put my phone down.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
  {
    name: "Pieter V.",
    role: "Founder · Amsterdam",
    quote:
      "We moved three companies to Ridgeford Capital Bank Business. Clean IBANs, clean statements, and the app never stalls at the till.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
  {
    name: "Aisha B.",
    role: "Medical resident · Hamburg",
    quote:
      "The interest on Spaces is the headline, but honestly the real-time notifications are what I'd miss if I left.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
  {
    name: "Tomáš H.",
    role: "Student · Prague",
    quote:
      "Free foreign ATM withdrawals during Erasmus saved me actual money. The card just works everywhere.",
    avatar:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=160&h=160&fit=crop&auto=format&q=70",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Loved across Europe
            </p>
            <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
              Real people. Real reasons to switch.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink-700">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            4,7 / 5 · 189.421 reviews
          </div>
        </div>
      </div>

      <div className="mt-10 relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-6 w-12 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-12 z-10 bg-gradient-to-l from-white to-transparent" />
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex gap-5 px-5 sm:px-8 pb-6 snap-x snap-mandatory">
            {REVIEWS.map((r, i) => (
              <motion.article
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="snap-start shrink-0 w-[320px] sm:w-[360px] rounded-2xl border border-ink-100 bg-panel p-6 shadow-card"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-ink-700">“{r.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-ink-100">
                    <Image src={r.avatar} alt={r.name} width={36} height={36} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{r.name}</div>
                    <div className="text-[12px] text-ink-400">{r.role}</div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
