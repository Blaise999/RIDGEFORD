"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, FileText, Receipt, Wallet2 } from "lucide-react";

const FEATURES = [
  { Icon: Receipt, title: "Automated invoicing", body: "Send invoices in under a minute. Get notified the second they're paid." },
  { Icon: FileText, title: "Tax-ready statements", body: "Export CSVs and PDFs your accountant will actually like." },
  { Icon: Wallet2, title: "Sub-accounts for tax", body: "Automatically set aside 19% VAT into a locked Space." },
];

export function Business() {
  return (
    <section id="business" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — image card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[5/6] rounded-[28px] overflow-hidden bg-ink-50"
          >
            <Image
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=1440&fit=crop&auto=format&q=75"
              alt="Freelancer working on laptop"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night-900/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="rounded-2xl bg-panel/95 backdrop-blur p-4 shadow-pop">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Invoice #2024-042
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-ink-900">Acme GmbH — paid</div>
                    <div className="text-[11.5px] text-ink-400">Just now · SEPA Instant</div>
                  </div>
                  <div className="text-[18px] font-bold text-brand-600">+ 2.400,00 €</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — copy */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              Business
            </p>
            <h2 className="mt-2 text-[38px] sm:text-[48px] leading-[1.04] font-bold tracking-tight text-ink-900">
              Built for freelancers and founders.
            </h2>
            <p className="mt-4 text-[17px] text-ink-500 leading-relaxed max-w-prose">
              If you run your own thing, you shouldn't spend weekends chasing invoices and tax math. Ridgeford Capital Bank Business takes the paperwork out of making money.
            </p>

            <ul className="mt-8 space-y-5">
              {FEATURES.map(({ Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-brand-500/10 text-brand-600 grid place-items-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold text-ink-900">{title}</div>
                    <div className="mt-0.5 text-[14.5px] text-ink-500 leading-relaxed">{body}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary group">
                Open a business account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <span className="inline-flex items-center gap-2 text-[13.5px] text-ink-500">
                <Check className="h-4 w-4 text-brand-600" /> Free first 3 months
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
