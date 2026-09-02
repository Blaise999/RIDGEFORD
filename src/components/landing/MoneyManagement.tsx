"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bell, TrendingUp, Leaf, PieChart, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cx } from "@/lib/utils";

type Row = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta: { label: string; href: string };
  visual: React.ReactNode;
  reverse?: boolean;
};

const ROWS: Row[] = [
  {
    id: "notifications",
    eyebrow: "Real-time",
    title: "Every payment, the second it happens.",
    body:
      "You'll know the moment a euro leaves your account — with smart push notifications that show the merchant, location, and running balance.",
    bullets: [
      "Instant push for every card tap",
      "Merchant names you'll actually recognise",
      "Running balance with each transaction",
    ],
    cta: { label: "See notifications", href: "#personal" },
    visual: <NotificationsVisual />,
  },
  {
    id: "insights",
    eyebrow: "Insights",
    title: "Automatic budgeting that actually makes sense.",
    body:
      "We sort every transaction into categories for you — groceries, transport, subscriptions — so you can spot where the money goes without lifting a finger.",
    bullets: [
      "20+ auto-tagged spending categories",
      "Monthly breakdowns and weekly nudges",
      "Set soft limits per category",
    ],
    cta: { label: "Explore Insights", href: "#personal" },
    visual: <InsightsVisual />,
    reverse: true,
  },
  {
    id: "round-up",
    eyebrow: "Round-ups",
    title: "Save your spare change, automatically.",
    body:
      "Turn on round-ups and every card payment rounds up to the next euro. The difference goes straight into a Space of your choice.",
    bullets: [
      "Set and forget — no manual work",
      "Pick which Space to feed",
      "Pause anytime in one tap",
    ],
    cta: { label: "Turn on round-ups", href: "/signup" },
    visual: <RoundupVisual />,
  },
];

export function MoneyManagement() {
  return (
    <section id="personal" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Money management
          </p>
          <h2 className="mt-2 text-[36px] sm:text-[46px] leading-[1.05] font-bold tracking-tight text-ink-900">
            A clearer picture of your money, every day.
          </h2>
          <p className="mt-4 text-[17px] text-ink-500 max-w-prose">
            Built for people who want to spend less time managing and more time living. These are the features that make Ridgeford Capital Bank feel like a second brain for your finances.
          </p>
        </div>

        <div className="mt-20 space-y-24 sm:space-y-28">
          {ROWS.map((row, i) => (
            <FeatureRow key={row.id} row={row} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ row, index }: { row: Row; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        "grid lg:grid-cols-2 gap-10 lg:gap-20 items-center",
        row.reverse && "lg:[&>*:first-child]:order-2"
      )}
    >
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          {row.eyebrow}
        </p>
        <h3 className="mt-2 text-[30px] sm:text-[38px] leading-[1.05] font-bold tracking-tight text-ink-900 max-w-[20ch]">
          {row.title}
        </h3>
        <p className="mt-4 text-[16.5px] text-ink-500 leading-relaxed max-w-prose">{row.body}</p>
        <ul className="mt-6 space-y-3">
          {row.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15.5px] text-ink-700">
              <span className="mt-0.5 grid place-items-center h-5 w-5 rounded-full bg-brand-500 text-white">
                <Check className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link href={row.cta.href} className="btn btn-ghost focus-ring group">
            {row.cta.label}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
      <div className="relative">{row.visual}</div>
    </motion.div>
  );
}

/* -------------------- Visuals -------------------- */

function NotificationsVisual() {
  return (
    <div className="relative h-[440px]">
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-brand-100 via-white to-white" />
      <div className="absolute inset-0 p-8 flex flex-col justify-center gap-3">
        <NotifCard
          icon={<Bell className="h-4 w-4 text-ink-900" />}
          title="Rewe — Berlin Mitte"
          sub="Just now"
          amount="− 32,40 €"
          delay={0}
        />
        <NotifCard
          icon={
            <div className="h-7 w-7 rounded-full overflow-hidden">
              <Image src="https://images.unsplash.com/photo-1542060748-10c28b62716f?w=80&h=80&fit=crop&auto=format&q=70" alt="Coffee" width={28} height={28} />
            </div>
          }
          title="The Barn Coffee"
          sub="2 min ago"
          amount="− 4,50 €"
          delay={0.15}
        />
        <NotifCard
          icon={<TrendingUp className="h-4 w-4 text-brand-600" />}
          title="Salary received"
          sub="30 Mar"
          amount="+ 3.200,00 €"
          delay={0.3}
          positive
        />
      </div>
    </div>
  );
}

function NotifCard({
  icon,
  title,
  sub,
  amount,
  positive,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  amount: string;
  positive?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl ring-1 ring-ink-100 shadow-pop px-4 py-3 flex items-center gap-3"
    >
      <div className="h-9 w-9 rounded-full bg-panel ring-1 ring-ink-100 grid place-items-center overflow-hidden">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-ink-900 truncate">{title}</div>
        <div className="text-[11.5px] text-ink-400">{sub}</div>
      </div>
      <div
        className={cx(
          "text-[14px] font-bold tabular-nums",
          positive ? "text-brand-600" : "text-ink-900"
        )}
      >
        {amount}
      </div>
    </motion.div>
  );
}

function InsightsVisual() {
  const cats = [
    { name: "Groceries", amt: "412 €", pct: 38, color: "bg-brand-500" },
    { name: "Restaurants", amt: "260 €", pct: 24, color: "bg-night-900" },
    { name: "Transport", amt: "152 €", pct: 14, color: "bg-amber-400" },
    { name: "Shopping", amt: "130 €", pct: 12, color: "bg-sky-500" },
  ];
  return (
    <div className="relative h-[440px]">
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-sky-100 via-white to-white" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-6 rounded-2xl bg-panel shadow-pop ring-1 ring-ink-100 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">April spending</div>
            <div className="mt-1 text-[28px] font-bold tracking-tight text-ink-900 leading-none">1.084,30 €</div>
          </div>
          <PieChart className="h-5 w-5 text-ink-300" />
        </div>

        <div className="mt-6 space-y-4">
          {cats.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-900">{c.name}</span>
                <span className="text-[12.5px] text-ink-500 tabular-nums">{c.amt}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-ink-100 overflow-hidden">
                <motion.span
                  className={cx("block h-full rounded-full", c.color)}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RoundupVisual() {
  return (
    <div className="relative h-[440px]">
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-amber-100 via-white to-white" />
      <div className="absolute inset-0 p-10 flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm rounded-2xl bg-panel shadow-pop ring-1 ring-ink-100 p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Card payment</span>
            <span className="text-[11px] text-ink-400">just now</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ink-50 grid place-items-center">🛒</div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink-900">Rewe Supermarkt</div>
              <div className="text-[11.5px] text-ink-400">Charged 4,72 €</div>
            </div>
            <div className="text-[15px] font-bold text-ink-900">− 4,72 €</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px] text-ink-500">
            <span>Rounded up to 5,00 €</span>
            <span className="font-semibold text-brand-600">+ 0,28 € → Holiday 🏖️</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full max-w-sm rounded-2xl bg-night-900 text-white p-5 shadow-pop"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center text-[18px]">🏖️</div>
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold">Holiday — Lisbon</div>
              <div className="text-[11.5px] text-white/60">Powered by round-ups</div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-bold">1.240 €</div>
              <div className="text-[10.5px] text-brand-300">+ 0,28 €</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.span
              className="block h-full bg-brand-400 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: "62%" }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-2 text-[11px] text-white/60 flex items-center gap-1.5">
            <Leaf className="h-3 w-3 text-brand-300" /> 62 % of your 2.000 € goal
          </div>
        </motion.div>
      </div>
    </div>
  );
}
