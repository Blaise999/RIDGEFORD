"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { fmtMoney, fmtRelativeDate, cx } from "@/lib/utils";

const TABS = [
  { id: "pending_admin", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "", label: "All" },
];

export default function AdminTransfersPage() {
  const [status, setStatus] = useState("pending_admin");
  const [rows, setRows] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const q = status ? `?status=${status}` : "";
    const r = await fetch(`/api/admin/transfers${q}`);
    const d = await r.json();
    setRows(d.transfers || []);
  }

  useEffect(() => {
    setRows(null);
    load();
    // eslint-disable-next-line
  }, [status]);

  async function approve(id: string) {
    if (!confirm("Approve this transfer? Funds will move immediately.")) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/transfers/${id}/approve`, { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }
  async function reject(id: string) {
    const reason = prompt("Reason for rejection (sent to customer):", "");
    if (reason === null) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/transfers/${id}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pt-6 space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink-900">Transfers</h1>
        <p className="text-[13.5px] text-ink-500 mt-1">
          Review and action customer transfer requests.
        </p>
      </div>

      <div className="card p-3 flex items-center gap-2">
        <div className="inline-flex rounded-full bg-ink-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.id || "all"}
              onClick={() => setStatus(t.id)}
              className={cx(
                "px-4 h-9 rounded-full text-[13.5px] font-semibold transition",
                status === t.id ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
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
          <div className="p-10 text-center text-[14px] text-ink-500">Nothing here.</div>
        ) : (
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-ink-50/60 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3">Ref</th>
                <th className="px-5 py-3">From</th>
                <th className="px-5 py-3">To</th>
                <th className="px-5 py-3">Rail</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((t) => {
                const senderName =
                  t.sender ? `${t.sender.first_name || ""} ${t.sender.last_name || ""}`.trim() || t.sender.email : "—";
                return (
                  <tr key={t.id} className="hover:bg-ink-50/40">
                    <td className="px-5 py-3 text-[13px] font-semibold text-ink-900">{t.reference_id}</td>
                    <td className="px-5 py-3">
                      <div className="text-[13.5px] font-semibold text-ink-900">{senderName}</div>
                      <div className="text-[11.5px] text-ink-400">{t.sender?.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[13.5px] font-semibold text-ink-900">{t.beneficiary_name}</div>
                      <div className="text-[11.5px] text-ink-400 tabular-nums">
                        {t.beneficiary_iban || t.beneficiary_email || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] uppercase text-ink-500">{t.rail}</td>
                    <td className="px-5 py-3 text-[14px] font-bold text-ink-900 tabular-nums">
                      {fmtMoney(Number(t.amount), t.currency)}
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-ink-500">{fmtRelativeDate(t.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {t.status === "pending_admin" ? (
                        <div className="inline-flex gap-2">
                          <button
                            disabled={busy === t.id}
                            onClick={() => approve(t.id)}
                            className="btn h-9 px-3 bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                          >
                            {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Approve
                          </button>
                          <button
                            disabled={busy === t.id}
                            onClick={() => reject(t.id)}
                            className="btn h-9 px-3 border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15 disabled:opacity-60"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <StatusPill s={t.status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending_admin: "bg-amber-500/15 text-amber-300",
    completed: "bg-brand-500/10 text-brand-700",
    rejected: "bg-red-500/15 text-red-300",
    canceled: "bg-ink-100 text-ink-700",
  };
  const label: Record<string, string> = {
    pending_admin: "Pending",
    completed: "Completed",
    rejected: "Rejected",
    canceled: "Canceled",
  };
  return (
    <span className={`inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${map[s] || "bg-ink-100 text-ink-700"}`}>
      {label[s] || s}
    </span>
  );
}
