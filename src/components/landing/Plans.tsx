"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { cx } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  featured?: boolean;
  bullets: string[];
};

const PLANS: Plan[] = [
  {
    name: "Standard",
    price: "0 €",
    period: "/ month",
    tagline: "The free mobile bank for everyday life.",
    bullets: [
      "Free German IBAN",
      "Free SEPA transfers",
      "3 free ATM withdrawals/month",
      "Apple Pay & Google Pay",
      "Up to 2 Spaces",
    ],
  },
  {
    name: "Smart",
    price: "4,90 €",
    period: "/ month",
    tagline: "More colours, more Spaces, more magic.",
    bullets: [
      "Everything in Standard",
      "Up to 10 Spaces",
      "Round-ups to Spaces",
      "5 free ATM withdrawals/month",
      "Premium-coloured card",
    ],
  },
  {
    name: "You",
    price: "9,90 €",
    period: "/ month",
    tagline: "For people who travel, a lot.",
    featured: true,
    bullets: [
      "Everything in Smart",
      "Unlimited ATM withdrawals in EUR",
      "Free withdrawals in any currency",
      "Travel & medical insurance",
      "Allianz partner offers",
    ],
  },
  {
    name: "Metal",
    price: "16,90 €",
    period: "/ month",
    tagline: "The full experience. A real metal card.",
    bullets: [
      "Everything in You",
      "Metal card (18 g)",
      "Dedicated concierge 24/7",
      "Phone & purchase insurance",
      "2,26 % interest on Spaces",
    ],
  },
];

export function Plans() {
  return (
    <section id="plans" className="py-24 sm:py-28 bg-ink-50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Plans
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
            Pick a plan. Change it anytime.
          </h2>
          <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
            Upgrade or downgrade in one tap. No contracts, no surprises, no small print.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={cx(
                "relative rounded-[22px] p-6 border bg-panel flex flex-col",
                p.featured
                  ? "border-gold-500 ring-1 ring-gold-500 shadow-pop lg:-translate-y-2"
                  : "border-ink-100 shadow-card"
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-night-900 text-white text-[10.5px] font-bold uppercase tracking-wide px-3 py-1">
                  Most popular
                </span>
              )}

              <div className="text-[14px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {p.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[34px] font-bold tracking-tight text-ink-900">{p.price}</span>
                <span className="text-[14px] text-ink-500">{p.period}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-ink-500 min-h-[40px]">{p.tagline}</p>

              <ul className="mt-5 space-y-2.5 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13.5px] text-ink-700">
                    <span className="mt-0.5 grid place-items-center h-4 w-4 rounded-full bg-brand-500/15 text-brand-600">
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={cx(
                  "mt-6 btn focus-ring w-full",
                  p.featured ? "btn-primary" : "btn-ghost"
                )}
              >
                Choose {p.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-[12.5px] text-ink-400 text-center">
          Prices shown incl. VAT. No hidden fees. You can cancel any plan at any time.
        </p>
      </div>
    </section>
  );
}
