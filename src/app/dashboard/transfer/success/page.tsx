"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/utils";

export default function SuccessPage() {
  const sp = useSearchParams();
  const ref = sp.get("ref");
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) return;
    fetch(`/api/transfers/${ref}`)
      .then((r) => r.json())
      .then((d) => setT(d.transfer))
      .finally(() => setLoading(false));
  }, [ref]);

  return (
    <div className="pt-10 max-w-xl mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="mx-auto h-20 w-20 rounded-full bg-brand-500/10 grid place-items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 16 }}
        >
          <CheckCircle2 className="h-12 w-12 text-brand-600" strokeWidth={2} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-6 text-center dash-h1 text-[30px] text-ink-900"
      >
        Transfer submitted
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-2 text-center text-[14.5px] text-ink-500"
      >
        Your transfer is now being reviewed. We'll email you the moment it's approved.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-8 card p-6"
      >
        {loading ? (
          <div className="py-8 text-center text-[13px] text-ink-400">Loading…</div>
        ) : t ? (
          <>
            <div className="text-center">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Amount
              </div>
              <div className="mt-1 text-[36px] font-bold text-ink-900 tabular-nums">
                {fmtMoney(Number(t.amount))}
              </div>
            </div>

            <ul className="mt-6 space-y-2.5">
              <Row k="Reference" v={t.reference_id} />
              <Row k="To" v={t.beneficiary_name} />
              {t.beneficiary_iban && <Row k="IBAN" v={t.beneficiary_iban} />}
              <Row k="Rail" v={railLabel(t.rail)} />
              <Row k="Submitted" v={fmtDate(t.created_at)} />
              <Row
                k="Status"
                v={
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 text-[11.5px] font-bold uppercase tracking-wide px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    Pending review
                  </span>
                }
              />
            </ul>
          </>
        ) : (
          <div className="text-center text-[14px] text-ink-500">
            Couldn't load transfer details. You can still find it in your transactions list.
          </div>
        )}
      </motion.div>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="btn btn-ghost flex-1">
          Back to dashboard
        </Link>
        <Link href="/dashboard/transactions" className="btn btn-primary flex-1">
          See all transactions
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between py-1">
      <span className="text-[13px] text-ink-500">{k}</span>
      <span className="text-[13.5px] font-semibold text-ink-900 text-right tabular-nums">{v}</span>
    </li>
  );
}

function railLabel(r: string) {
  if (r === "sepa_instant") return "SEPA Instant";
  if (r === "sepa") return "SEPA Transfer";
  if (r === "internal") return "Internal Transfer";
  return r;
}
