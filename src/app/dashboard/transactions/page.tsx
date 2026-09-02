"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Filter, Search, Loader2 } from "lucide-react";
import { fmtMoney, fmtRelativeDate, cx } from "@/lib/utils";

type Txn = {
  id: string;
  direction: "debit" | "credit";
  amount: number | string;
  currency: string;
  rail: string | null;
  category: string | null;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  description: string | null;
  merchant: string | null;
  reference: string | null;
  status: string;
  created_at: string;
};

const TABS = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

export default function TransactionsPage() {
  const [tab, setTab] = useState<"all" | "sent" | "received">("all");
  const [txns, setTxns] = useState<Txn[] | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const dir = tab === "all" ? "" : `?direction=${tab}`;
    fetch(`/api/transactions${dir}`)
      .then((r) => r.json())
      .then((d) => setTxns(d.transactions || []))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = useMemo(() => {
    if (!txns) return [];
    if (!q.trim()) return txns;
    const needle = q.toLowerCase();
    return txns.filter((t) =>
      [t.counterparty_name, t.merchant, t.description, t.reference]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle))
    );
  }, [txns, q]);

  const totalIn = useMemo(
    () =>
      (txns || [])
        .filter((t) => t.direction === "credit")
        .reduce((s, t) => s + Number(t.amount), 0),
    [txns]
  );
  const totalOut = useMemo(
    () =>
      (txns || [])
        .filter((t) => t.direction === "debit")
        .reduce((s, t) => s + Number(t.amount), 0),
    [txns]
  );

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="dash-h1 text-[28px] text-ink-900">Transactions</h1>
          <p className="text-[13.5px] text-ink-500 mt-1">
            Every payment in and out of your account, in real time.
          </p>
        </div>
        <Link href="/dashboard/transfer" className="btn btn-primary">
          New transfer
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="card p-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">Received</div>
          <div className="mt-1 text-[28px] font-bold text-brand-600 tracking-tight">
            + {fmtMoney(totalIn)}
          </div>
          <div className="text-[12px] text-ink-400 mt-0.5">{(txns || []).filter((t) => t.direction === "credit").length} transactions</div>
        </div>
        <div className="card p-5">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">Sent</div>
          <div className="mt-1 text-[28px] font-bold text-ink-900 tracking-tight">
            − {fmtMoney(totalOut)}
          </div>
          <div className="text-[12px] text-ink-400 mt-0.5">{(txns || []).filter((t) => t.direction === "debit").length} transactions</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="inline-flex rounded-full bg-ink-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cx(
                "px-4 h-9 rounded-full text-[13.5px] font-semibold transition",
                tab === t.id ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full h-10 rounded-full bg-ink-50 border border-ink-100 pl-10 pr-4 text-[14px] placeholder:text-ink-400 outline-none focus:bg-panel focus:border-ink-200"
            placeholder="Search transactions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <button className="btn btn-ghost h-10">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading && (
          <div className="p-10 text-center text-[14px] text-ink-400">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Loading…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center text-[14px] text-ink-500">
            Nothing here yet. Make your first transfer to see it land here.
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-ink-100">
            {groupByDay(filtered).map(([day, items]) => (
              <li key={day} className="bg-panel">
                <div className="px-5 sm:px-6 py-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-400 bg-ink-50/60">
                  {day}
                </div>
                <ul className="divide-y divide-ink-100">
                  {items.map((t) => (
                    <li key={t.id} className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-ink-50/50 transition">
                      <div
                        className={cx(
                          "h-10 w-10 rounded-full grid place-items-center shrink-0",
                          t.direction === "credit" ? "bg-brand-500/10 text-brand-700" : "bg-ink-100 text-ink-700"
                        )}
                      >
                        {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14.5px] font-semibold text-ink-900 truncate">
                          {t.counterparty_name || t.merchant || "Transaction"}
                        </div>
                        <div className="text-[12px] text-ink-400 truncate">
                          {t.description || railLabel(t.rail)}
                          {t.reference ? ` · ${t.reference}` : ""}
                          {t.counterparty_iban ? ` · ${t.counterparty_iban}` : ""}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={cx(
                            "text-[15px] font-bold tabular-nums",
                            t.direction === "credit" ? "text-brand-600" : "text-ink-900"
                          )}
                        >
                          {t.direction === "credit" ? "+ " : "− "}
                          {fmtMoney(Number(t.amount), t.currency)}
                        </div>
                        <div className="text-[11px] font-bold capitalize uppercase tracking-wide" style={{
                          color:
                            t.status === "posted" ? "#0a8a6f" :
                            t.status === "pending" ? "#b45309" :
                            t.status === "reversed" || t.status === "failed" ? "#b91c1c" :
                            "#6b7785"
                        }}>
                          {t.status === "posted" ? "Approved" :
                           t.status === "pending" ? "Pending" :
                           t.status === "reversed" ? "Rejected" :
                           t.status}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function groupByDay(txns: Txn[]): [string, Txn[]][] {
  const map = new Map<string, Txn[]>();
  for (const t of txns) {
    const label = fmtRelativeDate(t.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }
  return Array.from(map.entries());
}

function railLabel(r: string | null) {
  if (!r) return "Transfer";
  if (r === "sepa_instant") return "SEPA Instant";
  if (r === "sepa") return "SEPA Transfer";
  if (r === "internal") return "Internal Transfer";
  if (r === "topup") return "Top-up";
  if (r === "fee") return "Fee";
  return r.toUpperCase();
}
