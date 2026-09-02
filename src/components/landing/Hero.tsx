"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Coffee,
  CreditCard,
  Globe2,
  Plane,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgFade = useTransform(scrollYProgress, [0, 0.5, 0.85], [1, 0.9, 0]);
  const phoneY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const phoneScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95]);
  const card1Y = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const card2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const card3Y = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45, 0.7], [1, 0.6, 0]);

  // Edge-expand white reveal
  const whiteOpacity = useTransform(scrollYProgress, [0.35, 0.85], [0, 1]);
  const maskInner = useTransform(scrollYProgress, [0.3, 0.95], [140, 0]);
  const maskOuter = useTransform(scrollYProgress, [0.3, 0.95], [240, 80]);
  const maskImg = useTransform(
    [maskInner, maskOuter] as any,
    ([i, o]: number[]) =>
      `radial-gradient(circle at 72% 52%, transparent ${Math.max(0, i)}px, black ${o}px)`
  );

  // Mouse tilt on the phone
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 160, damping: 14 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 160, damping: 14 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={containerRef}
      data-nav-tint="dark"
      className="relative h-[200vh] lg:h-[220vh]"
      aria-label="Hero"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ───── Layer 0: background photo + blue tint ───── */}
        <motion.div
          style={{ y: reduce ? 0 : bgY, opacity: reduce ? 1 : bgFade }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=2400&q=80&auto=format&fit=crop"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/70 via-brand-800/60 to-night-900/80" />
          <div className="absolute inset-0 grid-bg opacity-[0.08]" />
        </motion.div>

        {/* ───── Layer 1: edge-expand white reveal ───── */}
        <motion.div
          aria-hidden
          style={{
            opacity: reduce ? 0 : whiteOpacity,
            WebkitMaskImage: reduce ? undefined : (maskImg as any),
            maskImage: reduce ? undefined : (maskImg as any),
          } as any}
          className="absolute inset-0 z-10 bg-panel"
        />

        {/* ───── Content — 2-column on lg, stacked on mobile ───── */}
        <motion.div
          style={{ opacity: reduce ? 1 : textOpacity }}
          className="relative z-30 h-full mx-auto max-w-7xl px-5 sm:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 lg:pb-10"
        >
          <div className="h-full lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-10 xl:gap-14">
            {/* ─── Left column — copy (lg+) / full width (mobile) ─── */}
            <div className="flex flex-col justify-center text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-flex mx-auto lg:mx-0 items-center gap-1.5 rounded-full glass-dark px-3 py-1 text-[12px] font-semibold text-white/95 self-center lg:self-start"
              >
                <Sparkles className="h-3.5 w-3.5 text-azure-400" />
                <span>Licensed German bank · BaFin regulated</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                className="mt-5 text-white font-bold leading-[0.95] tracking-[-0.03em]"
                style={{ fontSize: "clamp(40px, 7.4vw, 96px)" }}
              >
                CHANGE THE WAY <br />
                <span className="bg-gradient-to-r from-white via-azure-400 to-brand-400 bg-clip-text text-transparent">
                  YOU MANAGE MONEY
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-5 text-[16px] sm:text-[18px] text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                A mobile bank built for how you actually live — send money across 36 countries in seconds, save in Spaces, and spend with a card that just works.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3"
              >
                <Link href="/signup" className="btn btn-brand focus-ring">
                  Open an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#personal"
                  className="inline-flex items-center gap-2 rounded-full px-5 h-11 text-[14.5px] font-semibold text-white/90 border border-white/25 hover:bg-white/10 transition focus-ring"
                >
                  See how it works
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-8 inline-flex items-center gap-4 text-[12px] text-white/60 justify-center lg:justify-start self-center lg:self-start"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100.000 € deposit-protected
                </span>
                <span className="opacity-30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> 10-second SEPA Instant
                </span>
              </motion.div>
            </div>

            {/* ─── Right column — phone + cards (lg+) ─── */}
            <div className="relative hidden lg:flex items-center justify-center">
              {/* Glow */}
              <motion.div
                aria-hidden
                className="absolute h-[440px] w-[440px] rounded-full bg-brand-500/45 blur-3xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Phone */}
              <div onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
                <motion.div
                  style={{
                    y: reduce ? 0 : phoneY,
                    scale: reduce ? 1 : phoneScale,
                    rotateX: reduce ? 0 : rotX,
                    rotateY: reduce ? 0 : rotY,
                    transformPerspective: 1000,
                  }}
                  className="relative"
                >
                  <PhoneMockup />
                </motion.div>
              </div>

              {/* Card 1 — top-left of the phone (safely to the left) */}
              <motion.div
                style={{ y: reduce ? 0 : card1Y }}
                initial={{ opacity: 0, x: -30, y: 20, rotate: -8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: -5, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute z-20 top-[8%] left-[-2%] w-[260px]"
              >
                <NotifCard />
              </motion.div>

              {/* Card 2 — bottom-right of the phone */}
              <motion.div
                style={{ y: reduce ? 0 : card2Y }}
                initial={{ opacity: 0, x: 30, y: 20, rotate: 8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 5, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute z-20 bottom-[6%] right-[-6%] w-[280px]"
              >
                <CardCard />
              </motion.div>

              {/* Card 3 — top-right */}
              <motion.div
                style={{ y: reduce ? 0 : card3Y }}
                initial={{ opacity: 0, x: 30, y: -20, rotate: 4, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 3, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute z-20 top-[-2%] right-[-4%] w-[240px]"
              >
                <TravelCard />
              </motion.div>
            </div>
          </div>

          {/* ─── Mobile — phone + cards stacked under copy ─── */}
          <div className="lg:hidden mt-8 relative h-[540px]" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                aria-hidden
                className="absolute h-[360px] w-[360px] rounded-full bg-brand-500/40 blur-3xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                style={{
                  y: reduce ? 0 : phoneY,
                  scale: reduce ? 1 : phoneScale,
                }}
                className="relative scale-[0.78] origin-center"
              >
                <PhoneMockup />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: -4 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="absolute z-30 top-[10%] left-2 w-[220px]"
            >
              <NotifCard />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0, rotate: 4 }}
              transition={{ duration: 0.9, delay: 0.75 }}
              className="absolute z-30 bottom-[8%] right-2 w-[240px]"
            >
              <CardCard />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ========== Phone + cards ========== */

function PhoneMockup() {
  return (
    <div className="relative w-[300px] h-[610px] sm:w-[320px] sm:h-[650px]">
      <div className="absolute inset-0 rounded-[46px] bg-gradient-to-b from-night-900 to-night-800 ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(10,12,16,0.6),0_10px_40px_-10px_rgba(47,102,255,0.35)]" />
      <div className="absolute inset-[6px] rounded-[40px] overflow-hidden bg-panel">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 h-6 w-24 rounded-full bg-black" />
        <div className="absolute top-2.5 left-0 right-0 z-20 flex justify-between px-6 text-[10.5px] font-semibold text-ink-700 pointer-events-none">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 9V7M4 9V5M7 9V3M10 9V1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
              <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" />
              <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor" />
              <rect x="20" y="3" width="1.5" height="4" rx="0.75" fill="currentColor" />
            </svg>
          </span>
        </div>

        <div className="h-full w-full pt-11 px-5 pb-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white text-[10px] font-bold">L</div>
              <span className="text-[12px] font-semibold text-ink-700">Hi, Lena</span>
            </div>
            <Bell className="h-4 w-4 text-ink-500" />
          </div>

          <div className="mt-5">
            <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Main account</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[32px] font-bold tracking-tight text-ink-900">4.827</span>
              <span className="text-[20px] font-semibold text-ink-500">€</span>
            </div>
            <div className="mt-1 text-[11px] text-brand-600 font-medium">+ 312 € this week</div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {[
              { Icon: ArrowUpRight, label: "Send" },
              { Icon: ArrowDownLeft, label: "Top up" },
              { Icon: CreditCard, label: "Card" },
              { Icon: Globe2, label: "Int'l" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="h-10 w-10 rounded-2xl bg-ink-50 grid place-items-center">
                  <Icon className="h-4 w-4 text-ink-900" />
                </div>
                <span className="text-[10px] font-medium text-ink-700">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink-900">Recent</span>
              <span className="text-[11px] text-ink-500">See all</span>
            </div>
            <ul className="mt-2 space-y-2.5">
              {[
                { Icon: Coffee, name: "The Barn Coffee", when: "Today", amount: "− 4 €", pos: false },
                { Icon: ArrowDownLeft, name: "Anna → you", when: "Today", amount: "+ 120 €", pos: true },
                { Icon: Plane, name: "Lufthansa — LIS", when: "Yesterday", amount: "− 189 €", pos: false },
                { Icon: ArrowDownLeft, name: "Salary", when: "30 Mar", amount: "+ 3.200 €", pos: true },
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-ink-50 grid place-items-center">
                    <t.Icon className="h-3.5 w-3.5 text-ink-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-ink-900 truncate">{t.name}</div>
                    <div className="text-[10.5px] text-ink-400">{t.when}</div>
                  </div>
                  <div className={`text-[12px] font-semibold ${t.pos ? "text-brand-600" : "text-ink-900"}`}>
                    {t.amount}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotifCard() {
  return (
    <div className="glass rounded-2xl shadow-pop ring-1 ring-white/40 p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-brand-500 text-white grid place-items-center">
          <Bell className="h-4 w-4" />
        </div>
        <span className="text-[11.5px] font-semibold text-ink-500">Live notification</span>
        <span className="ml-auto text-[10.5px] text-ink-400">now</span>
      </div>
      <div className="mt-3 text-[14px] font-semibold text-ink-900 leading-snug">
        Rewe Supermarkt · Berlin Mitte
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-500">Balance 4.823 €</span>
        <span className="text-[15px] font-bold text-ink-900">− 32 €</span>
      </div>
    </div>
  );
}

function CardCard() {
  return (
    <div className="glass rounded-2xl shadow-pop ring-1 ring-white/40 p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-night-900 text-white grid place-items-center">
          <CreditCard className="h-4 w-4" />
        </div>
        <span className="text-[11.5px] font-semibold text-ink-500">Weekly spending</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[24px] font-bold text-ink-900 tracking-tight">438 €</span>
        <span className="text-[12px] text-ink-400">of 1.200 €</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-panel/70 overflow-hidden">
        <div className="h-full w-[36%] rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-500">
        <svg viewBox="0 0 40 24" className="h-4 w-6">
          <rect x="0.5" y="0.5" width="39" height="23" rx="3" fill="#0a0c10" />
          <rect x="6" y="9" width="8" height="6" rx="1" fill="#eab308" />
        </svg>
        Metal · •••• 4417
      </div>
    </div>
  );
}

function TravelCard() {
  return (
    <div className="glass-dark rounded-2xl shadow-pop p-4 text-white">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center">
          <Plane className="h-4 w-4" />
        </div>
        <span className="text-[11.5px] font-semibold text-white/70">International</span>
        <span className="ml-auto text-[10.5px] text-white/50">Sent</span>
      </div>
      <div className="mt-3 text-[13.5px] font-semibold leading-snug">
        → Sofía · Barcelona
      </div>
      <div className="mt-0.5 text-[11px] text-white/60 tabular-nums">ES91 2100 ···· 3000</div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-[11.5px] text-white/70">Arrives in 10s</span>
        <span className="text-[17px] font-bold">600 €</span>
      </div>
    </div>
  );
}
