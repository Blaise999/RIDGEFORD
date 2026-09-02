"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { useRouter } from "next/navigation";

export function AccountFlagged({
  firstName,
  reason,
  blockedAt,
}: {
  firstName?: string | null;
  reason?: string | null;
  blockedAt?: string | null;
}) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const ticketRef = `SUP-${(blockedAt ? new Date(blockedAt).getTime() : Date.now()).toString(16).slice(-8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-50">
      {/* Top bar */}
      <div className="h-16 flex items-center justify-between px-5 sm:px-8 border-b border-ink-100 bg-panel">
        <Logo />
        <button
          onClick={logout}
          className="text-[13px] font-semibold text-ink-500 hover:text-ink-900"
        >
          Sign out
        </button>
      </div>

      <div className="mx-auto max-w-2xl px-5 sm:px-8 py-8 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="card p-6 sm:p-10 overflow-hidden relative"
        >
          {/* Decorative blue glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-red-500/25/40 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Account under review
            </div>

            <h1 className="mt-5 text-[30px] sm:text-[38px] font-bold tracking-tight text-ink-900 leading-[1.1]">
              Your account has been flagged.
            </h1>
            <p className="mt-3 text-[15.5px] sm:text-[17px] text-ink-600 leading-relaxed">
              Hi {firstName || "there"}, for your protection we've placed a temporary hold on this account while our compliance team completes a review. During this time you can sign in and see your balance and history, but transfers and other account actions are paused.
            </p>

            {reason && (
              <div className="mt-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-300">
                  Review note
                </div>
                <div className="mt-1 text-[14px] text-red-300 leading-relaxed">{reason}</div>
              </div>
            )}

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <InfoCard
                Icon={Mail}
                title="Email support"
                body="support@ridgefordbank.eu"
                href="mailto:support@ridgefordbank.eu?subject=Account%20review%20assistance"
              />
              <InfoCard
                Icon={Phone}
                title="Call us"
                body="+49 30 555 82 82 (Mon–Fri, 9–18 CET)"
                href="tel:+493055582828"
              />
              <InfoCard
                Icon={MessageCircle}
                title="In-app chat"
                body="Open a secure support thread from this account."
                href="mailto:support@ridgefordbank.eu?subject=Support%20request"
              />
              <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                  Your reference
                </div>
                <div className="mt-1 text-[16px] font-bold text-ink-900 tabular-nums">
                  {ticketRef}
                </div>
                <div className="mt-1 text-[11.5px] text-ink-400">
                  Quote this when contacting support.
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-ink-50 border border-ink-100 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-panel grid place-items-center text-ink-700 border border-ink-100 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink-900">
                    What happens next
                  </div>
                  <ul className="mt-1.5 text-[13px] text-ink-600 space-y-1.5 leading-relaxed list-disc list-inside marker:text-ink-300">
                    <li>Most reviews complete within 1–2 business days.</li>
                    <li>Our team may reach out by email if we need additional information.</li>
                    <li>Your funds remain safe with Ridgeford Capital Bank and are protected by the German deposit-guarantee scheme up to 100.000 €.</li>
                    <li>You'll receive an email the moment the review closes.</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-8 text-[12px] text-ink-400 leading-relaxed">
              Ridgeford Capital Bank AG — Kaiserstraße 16, 60311 Frankfurt am Main. Supervised by BaFin and the Deutsche Bundesbank.
              This message is automated but a real person is reviewing your case.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function InfoCard({
  Icon, title, body, href,
}: { Icon: any; title: string; body: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-ink-100 bg-panel p-4 hover:shadow-card transition h-full">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-700 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[13.5px] font-semibold text-ink-900">{title}</div>
      </div>
      <div className="mt-2 text-[13px] text-ink-600 leading-snug">{body}</div>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
