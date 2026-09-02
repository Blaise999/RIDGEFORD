"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const ITEMS = [
  {
    q: "Is Ridgeford Capital Bank a real bank?",
    a: "Yes. Ridgeford Capital Bank AG is a fully licensed credit institution headquartered in Frankfurt am Main, regulated by the Federal Financial Supervisory Authority (BaFin) and the Deutsche Bundesbank. Your deposits are protected up to €100,000 by the German deposit-guarantee scheme.",
  },
  {
    q: "How long does it take to open an account?",
    a: "Most customers are up and running in 8 minutes. Download the app, enter a few details, verify your ID with a short video call, and your account and IBAN are active the same day.",
  },
  {
    q: "What is SEPA Instant and is it really free?",
    a: "SEPA Instant is the European real-time payment scheme — money arrives in the recipient's account within 10 seconds. It's included at no extra cost on every Ridgeford Capital Bank plan.",
  },
  {
    q: "Can I use my card abroad?",
    a: "Yes, everywhere Mastercard is accepted. Standard and Smart plans include a few free withdrawals per month. You plans and higher include unlimited free withdrawals in any currency worldwide.",
  },
  {
    q: "How does the 2,26 % interest on Spaces work?",
    a: "On eligible plans, we pay interest on the balance of every Space — calculated daily and paid monthly. You can move money in and out at any time with no lock-in.",
  },
  {
    q: "What happens if my card is lost or stolen?",
    a: "Freeze it from the app in a single tap — the card is instantly deactivated. Order a replacement, or unfreeze it yourself when you find it again under the sofa.",
  },
  {
    q: "How do I switch from my current bank?",
    a: "Our switching service moves standing orders and direct debits from your old bank automatically. Most people are fully migrated within a couple of weeks.",
  },
  {
    q: "Can I use Ridgeford Capital Bank for my business?",
    a: "Yes. Ridgeford Capital Bank Business is designed for freelancers, founders, and small companies, with tools for invoicing, automatic VAT setaside, and clean statements for your accountant.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            FAQ
          </p>
          <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-ink-100 border-y border-ink-100">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left py-5 flex items-center justify-between gap-4 focus-ring"
                  aria-expanded={isOpen}
                >
                  <span className="text-[16.5px] font-semibold text-ink-900">{it.q}</span>
                  <span className="shrink-0 h-8 w-8 rounded-full border border-ink-200 grid place-items-center text-ink-900">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-[15.5px] text-ink-600 leading-relaxed">
                        {it.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
