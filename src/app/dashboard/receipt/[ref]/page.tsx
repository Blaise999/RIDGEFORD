"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle, Printer, Loader2 } from "lucide-react";
import { fmtMoney, fmtDate, cx } from "@/lib/utils";

export default function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/transfers/${ref}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setT(d?.transfer || null))
      .catch(() => setT(null))
      .finally(() => setLoading(false));
  }, [ref]);

  if (loading) {
    return (
      <div className="pt-10 text-center text-[13.5px] text-ink-400">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
        Loading receipt…
      </div>
    );
  }

  if (!t) {
    return (
      <div className="pt-10 text-center text-[14px] text-ink-500">
        Receipt not found.{" "}
        <Link href="/dashboard/transactions" className="text-brand-600 font-semibold hover:underline">
          See transactions
        </Link>
      </div>
    );
  }

  const status = t.status as string;
  const statusMap: Record<string, { Icon: any; label: string; bg: string; fg: string }> = {
    pending_admin: { Icon: Clock, label: "Pending review", bg: "bg-amber-500/15", fg: "text-amber-300" },
    completed: { Icon: CheckCircle2, label: "Settled", bg: "bg-brand-500/10", fg: "text-brand-700" },
    rejected: { Icon: XCircle, label: "Rejected", bg: "bg-red-500/15", fg: "text-red-300" },
    canceled: { Icon: XCircle, label: "Canceled", bg: "bg-ink-100", fg: "text-ink-700" },
  };
  const s = statusMap[status] || statusMap.completed;

  function safePrint() {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }

  return (
    <div className="pt-4 sm:pt-6 max-w-2xl mx-auto pb-12 print:pt-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/transactions" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" /> All transactions
        </Link>
        <button onClick={safePrint} className="btn btn-ghost h-9 px-3" type="button">
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="mt-5 card p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-night-900 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              Ridgeford Capital Bank · Receipt
            </div>
            <h1 className="mt-3 dash-h1 text-[30px] text-ink-900">
              Payment receipt
            </h1>
            <div className="text-[13px] text-ink-500 mt-0.5">Reference {t.reference_id || "—"}</div>
          </div>
          <span className={cx("inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide px-3 py-1.5", s.bg, s.fg)}>
            <s.Icon className="h-3.5 w-3.5" />
            {s.label}
          </span>
        </div>

        {/* Amount */}
        <div className="mt-8 pb-6 border-b border-ink-100">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">Amount</div>
          <div className="mt-1 text-[44px] sm:text-[52px] font-bold text-ink-900 tracking-tight tabular-nums leading-none">
            {fmtMoney(Number(t.amount) || 0, t.currency || "EUR")}
          </div>
          {Number(t.fee) > 0 && (
            <div className="mt-1 text-[12.5px] text-ink-500">
              + fee {fmtMoney(Number(t.fee), t.currency || "EUR")}
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-2">From</div>
            <Row k="Account" v={accountLabel(t.account_type)} />
            <Row k="Rail" v={railLabel(t.rail)} />
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-2">To</div>
            <Row k="Name" v={t.beneficiary_name || "—"} />
            {t.beneficiary_iban && <Row k="IBAN" v={t.beneficiary_iban} />}
            {t.beneficiary_bic && <Row k="BIC / SWIFT" v={t.beneficiary_bic} />}
            {t.beneficiary_country && <Row k="Country" v={t.beneficiary_country} />}
            {t.beneficiary_email && <Row k="Email" v={t.beneficiary_email} />}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ink-100 grid sm:grid-cols-2 gap-6">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-2">Dates</div>
            {t.created_at && <Row k="Submitted" v={fmtDate(t.created_at)} />}
            {t.completed_at && <Row k="Completed" v={fmtDate(t.completed_at)} />}
            {t.reviewed_at && !t.completed_at && <Row k="Reviewed" v={fmtDate(t.reviewed_at)} />}
          </div>
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-2">Metadata</div>
            {t.reference && <Row k="Reference" v={t.reference} />}
            {t.memo && <Row k="Note" v={t.memo} />}
            {t.rejection_reason && <Row k="Rejection reason" v={t.rejection_reason} />}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-ink-100 text-[11.5px] text-ink-400 leading-relaxed">
          Ridgeford Capital Bank AG · Friedrichstraße 1 · 10117 Berlin, Germany. Supervised by BaFin and the Deutsche Bundesbank.
          This receipt is an automated confirmation of the transaction above and does not require a signature.
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-1 gap-3">
      <span className="text-[12.5px] text-ink-500 shrink-0">{k}</span>
      <span className="text-[13.5px] font-semibold text-ink-900 text-right tabular-nums break-all">{v}</span>
    </div>
  );
}

function accountLabel(a: string | null | undefined) {
  return a === "savings" ? "Savings" : "Checking";
}

// Null-safe — original threw `r.toUpperCase()` on null.
function railLabel(r: string | null | undefined) {
  if (!r) return "Transfer";
  if (r === "sepa_instant") return "SEPA Instant";
  if (r === "sepa") return "SEPA Transfer";
  if (r === "internal") return "Internal Transfer";
  if (r === "swift") return "International (SWIFT)";
  if (r === "topup") return "Top-up";
  if (r === "fee") return "Fee";
  return String(r).toUpperCase();
}
