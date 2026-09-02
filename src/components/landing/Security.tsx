"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint, BellRing, Eye, Ban } from "lucide-react";

const ITEMS = [
  {
    Icon: Shield,
    title: "100.000 € protected",
    body: "Your deposits are protected by the German deposit-guarantee scheme up to €100,000 per customer.",
  },
  {
    Icon: Lock,
    title: "3D Secure by default",
    body: "Every online payment is confirmed with a tap in the app. No one uses your card but you.",
  },
  {
    Icon: Fingerprint,
    title: "Biometric sign-in",
    body: "Face ID and Touch ID are mandatory for high-risk actions. Your phone is your vault.",
  },
  {
    Icon: BellRing,
    title: "Real-time alerts",
    body: "Every card tap, every login, every change — you see it before anyone else could.",
  },
  {
    Icon: Ban,
    title: "Freeze in one tap",
    body: "Lose your card on the train home? Freeze it from your phone — and unfreeze when it turns up.",
  },
  {
    Icon: Eye,
    title: "Fraud monitoring, 24/7",
    body: "Our risk systems watch every transaction in the background, so you don't have to.",
  },
];

export function Security() {
  return (
    <section className="py-24 sm:py-28 bg-night-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(circle_at_50%_0%,black,transparent_70%)]">
        <div className="absolute inset-0" style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }} />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 relative">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-400">
            Security
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight">
            Your money, <span className="text-brand-400">safe by design</span>.
          </h2>
          <p className="mt-4 text-[17px] text-white/70 leading-relaxed max-w-prose">
            Ridgeford Capital Bank AG is a fully licensed German bank, regulated by BaFin and the Deutsche Bundesbank. Security isn't a feature — it's the whole product.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 hover:bg-white/[0.07] transition"
            >
              <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-300 grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[16px] font-semibold">{title}</div>
              <div className="mt-1.5 text-[14px] text-white/60 leading-relaxed">{body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
