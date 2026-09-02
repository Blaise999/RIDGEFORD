"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Infinity as Infinit } from "lucide-react";
import { cx } from "@/lib/utils";

type CardTier = {
  id: string;
  name: string;
  priceLabel: string;
  bg: string;
  text: "light" | "dark";
  accent: string;
  bullets: string[];
  popular?: boolean;
};

const CARDS: CardTier[] = [
  {
    id: "standard",
    name: "Standard",
    priceLabel: "Free",
    bg: "bg-gradient-to-br from-white to-ink-50 border border-ink-100",
    text: "dark",
    accent: "from-brand-400 to-brand-600",
    bullets: ["Free Ridgeford Capital Bank account", "Free ATM withdrawals in EUR", "Apple Pay & Google Pay"],
  },
  {
    id: "you",
    name: "You",
    priceLabel: "9,90 € / month",
    bg: "bg-gradient-to-br from-brand-500 via-brand-500 to-brand-700",
    text: "light",
    accent: "from-white/80 to-white/40",
    bullets: ["5 ATM withdrawals worldwide", "Travel & medical insurance", "Partner offers worth 100 €/yr"],
    popular: true,
  },
  {
    id: "metal",
    name: "Metal",
    priceLabel: "16,90 € / month",
    bg: "bg-gradient-to-br from-night-800 via-night-800 to-night-900",
    text: "light",
    accent: "from-amber-200 to-amber-400",
    bullets: ["A real metal card (18 g)", "Unlimited ATM withdrawals", "Dedicated 24/7 concierge"],
  },
];

export function CardsShowcase() {
  return (
    <section id="cards" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Cards
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
            Three cards. One you.
          </h2>
          <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
            Pick the card that matches how you spend. Upgrade or downgrade anytime — no strings attached, no hidden fees.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={cx(
                "relative rounded-[28px] p-6 sm:p-8",
                c.bg,
                "shadow-card hover:shadow-pop transition"
              )}
            >
              {c.popular && (
                <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-panel/95 text-brand-700 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
                  Most popular
                </span>
              )}

              <MiniCard tier={c} />

              <div className={cx("mt-6", c.text === "light" ? "text-white" : "text-ink-900")}>
                <div className="text-[13px] font-semibold uppercase tracking-[0.14em] opacity-75">
                  {c.name}
                </div>
                <div className="mt-1 text-[24px] font-bold tracking-tight">{c.priceLabel}</div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {c.bullets.map((b) => (
                  <li
                    key={b}
                    className={cx(
                      "flex items-start gap-2 text-[14px]",
                      c.text === "light" ? "text-white/90" : "text-ink-700"
                    )}
                  >
                    <span
                      className={cx(
                        "mt-0.5 grid place-items-center h-4 w-4 rounded-full",
                        c.text === "light" ? "bg-white/20" : "bg-brand-500/15 text-brand-600"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={cx(
                  "mt-7 btn focus-ring w-full",
                  c.text === "light" ? "bg-panel text-ink-900 hover:bg-ink-50" : "btn-primary"
                )}
              >
                Choose {c.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniCard({ tier }: { tier: CardTier }) {
  const light = tier.text === "light";
  return (
    <div
      className={cx(
        "relative aspect-[1.586/1] w-full rounded-2xl p-5 overflow-hidden",
        light ? "ring-1 ring-white/15" : "ring-1 ring-ink-100 bg-panel"
      )}
      style={{
        background: light
          ? tier.id === "metal"
            ? "linear-gradient(135deg, #0a0c10, #262c34 60%, #3d4753)"
            : "linear-gradient(135deg, #15a586, #0a8a6f 80%)"
          : "linear-gradient(135deg, #ffffff, #f7f8fa 80%)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cx("h-4 w-4 rounded-sm", light ? "bg-panel/85" : "bg-brand-500")} />
          <span
            className={cx(
              "text-[10px] font-bold tracking-[0.2em] uppercase",
              light ? "text-white" : "text-ink-700"
            )}
          >
            RIDGEFORD
          </span>
        </div>
        <Infinit className={cx("h-4 w-4", light ? "text-white/70" : "text-ink-400")} />
      </div>
      <div
        className={cx(
          "mt-8 text-[15px] tracking-[0.25em] font-semibold",
          light ? "text-white" : "text-ink-900"
        )}
      >
        •••• •••• •••• 4417
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <div
            className={cx(
              "text-[8px] uppercase tracking-wide",
              light ? "text-white/60" : "text-ink-400"
            )}
          >
            Cardholder
          </div>
          <div className={cx("mt-0.5 text-[11px] font-semibold", light ? "text-white" : "text-ink-900")}>
            Lena Schmidt
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="h-5 w-5 rounded-full bg-[#eb001b]" />
          <span className="h-5 w-5 rounded-full bg-[#f79e1b] -ml-2 mix-blend-multiply" />
        </div>
      </div>

      {/* Shimmer */}
      <span className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </div>
  );
}
