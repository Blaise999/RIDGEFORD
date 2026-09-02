"use client";

import { motion } from "framer-motion";
import { PhoneFrame } from "./PhoneFrame";
import { ScreenHome } from "./screens/ScreenHome";
import { ScreenInsights } from "./screens/ScreenInsights";

export function AppShowcase() {
  return (
    <section className="py-24 sm:py-28 bg-panel relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/50 via-white to-white" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Get the app
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
            Open an account in <span className="text-gradient">8 minutes</span>, straight from your phone.
          </h2>
          <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
            No paper forms. No trips to a branch. Just your ID, a 30-second video verification, and you're in.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <StoreButton
              store="App Store"
              top="Download on the"
              icon={<AppleIcon className="h-7 w-7" />}
            />
            <StoreButton
              store="Google Play"
              top="Get it on"
              icon={<PlayIcon className="h-7 w-7" />}
            />
          </div>

          <div className="mt-10 flex items-center gap-8">
            <QRCodeBlock />
            <div className="text-[14px] text-ink-500 max-w-[220px] leading-relaxed">
              Scan the code with your phone camera to jump straight to the App Store or Google Play.
            </div>
          </div>
        </div>

        <div className="relative h-[680px] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-0 rotate-[-6deg]"
          >
            <PhoneFrame><ScreenInsights /></PhoneFrame>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 bottom-0 rotate-[5deg]"
          >
            <PhoneFrame><ScreenHome /></PhoneFrame>
          </motion.div>

          {/* Halo */}
          <div className="absolute h-[480px] w-[480px] rounded-full bg-brand-400/20 blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

function StoreButton({
  store,
  top,
  icon,
}: {
  store: string;
  top: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-3 rounded-2xl bg-night-900 text-white px-4 py-3 hover:bg-night-800 transition focus-ring"
    >
      {icon}
      <span className="flex flex-col leading-none">
        <span className="text-[10.5px] text-white/70">{top}</span>
        <span className="text-[15px] font-semibold mt-0.5">{store}</span>
      </span>
    </a>
  );
}

function QRCodeBlock() {
  // Simple stylised QR — placeholder, not a real scannable code
  const rows = 9;
  const cols = 9;
  const dots = Array.from({ length: rows * cols }, (_, i) => {
    // deterministic pseudo-random fill
    const seed = (i * 2654435761) % 997;
    return seed % 3 !== 0;
  });
  return (
    <div className="h-[140px] w-[140px] rounded-2xl bg-panel ring-1 ring-ink-100 shadow-card p-3 grid grid-cols-9 gap-[2px]">
      {dots.map((on, i) => (
        <span
          key={i}
          className={`rounded-[1px] ${on ? "bg-night-900" : "bg-panel"}`}
          style={{ aspectRatio: "1/1" }}
        />
      ))}
    </div>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.365 12.835c-.021-2.38 1.948-3.522 2.038-3.577-1.112-1.624-2.841-1.847-3.455-1.874-1.47-.148-2.87.866-3.616.866-.76 0-1.903-.848-3.13-.824-1.6.023-3.094.93-3.918 2.357-1.675 2.904-.428 7.187 1.197 9.537.795 1.152 1.74 2.44 2.983 2.395 1.203-.048 1.656-.776 3.108-.776 1.44 0 1.862.776 3.13.75 1.293-.023 2.112-1.173 2.903-2.331.922-1.331 1.298-2.637 1.32-2.706-.03-.014-2.536-.974-2.56-3.817zM13.94 5.91c.664-.807 1.11-1.922.987-3.035-.954.04-2.108.636-2.792 1.44-.614.716-1.152 1.867-1.009 2.956 1.063.082 2.147-.54 2.814-1.361z"/>
    </svg>
  );
}
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#34a853" d="M3.6 20.6 13.5 12 3.6 3.4c-.4.3-.6.8-.6 1.4v14.4c0 .6.2 1.1.6 1.4z"/>
      <path fill="#fbbc04" d="M16.8 15.3 13.5 12l3.3-3.3 3.9 2.3c.8.5.8 1.6 0 2l-3.9 2.3z"/>
      <path fill="#ea4335" d="M3.6 3.4 13.5 12l3.3-3.3L5.2 2.2c-.6-.3-1.2-.1-1.6.4z"/>
      <path fill="#4285f4" d="M16.8 15.3 5.2 21.8c-.4.3-1 .4-1.6.1 l9.9-9.9z"/>
    </svg>
  );
}
