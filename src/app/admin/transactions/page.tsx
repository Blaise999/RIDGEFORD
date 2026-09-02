"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { fmtMoney, fmtRelativeDate, cx } from "@/lib/utils";

const TABS = [
  { id: "", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];

export default function AdminTransactionsPage() {
  const [dir, setDir] = useState("");
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    setRows(null);
    const q = dir ? `?direction=${dir}` : "";
    fetch(`/api/admin/transactions${q}`)
      .then((r) => r.json())
      .then((d) => setRows(d.transactions || []));
  }, [dir]);

  return (
    <div className="pt-6 space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink-900">Transactions</h1>
        <p className="text-[13.5px] text-ink-500 mt-1">
          Every posted ledger row across all users.
        </p>
      </div>

      <div className="card p-3 flex items-center gap-2">
        <div className="inline-flex rounded-full bg-ink-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.id || "all"}
              onClick={() => setDir(t.id)}
              className={cx(
                "px-4 h-9 rounded-full text-[13.5px] font-semibold transition",
                dir === t.id ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {rows === null ? (
          <div className="p-10 text-center text-[14px] text-ink-400">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-ink-500">No transactions.</div>
        ) : (
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-ink-50/60 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3"></th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Counterparty</th>
                <th className="px-5 py-3">Rail</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-ink-50/40">
                  <td className="px-5 py-3">
                    <div className={cx(
                      "h-8 w-8 rounded-full grid place-items-center",
                      t.direction === "credit" ? "bg-brand-500/10 text-brand-700" : "bg-ink-100 text-ink-700"
                    )}>
                      {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-[13.5px] font-semibold text-ink-900">
                      {t.user ? `${t.user.first_name || ""} ${t.user.last_name || ""}`.trim() || t.user.email : "—"}
                    </div>
                    <div className="text-[11.5px] text-ink-400">{t.user?.email}</div>
                  </td>
                  <td className="px-5 py-3 text-[13.5px] text-ink-700">
                    {t.counterparty_name || t.merchant || "—"}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] uppercase text-ink-500">{t.rail || "—"}</td>
                  <td className={cx(
                    "px-5 py-3 text-[14px] font-bold tabular-nums",
                    t.direction === "credit" ? "text-brand-600" : "text-ink-900"
                  )}>
                    {t.direction === "credit" ? "+ " : "− "}
                    {fmtMoney(Number(t.amount), t.currency)}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-500">{fmtRelativeDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
