"use client";

import { useEffect, useState } from "react";
import { fmtCoin } from "@/lib/crypto";
import { fmtMoney, cx } from "@/lib/utils";
import { AlertTriangle, Check, Copy, Loader2, X } from "lucide-react";

const TABS = [
  { v: "pending_admin", l: "Pending" },
  { v: "sent", l: "Sent" },
  { v: "rejected", l: "Rejected" },
  { v: "all", l: "All" },
];

export default function AdminCryptoPage() {
  const [tab, setTab] = useState("pending_admin");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/crypto/withdrawals?status=${tab}`, { credentials: "same-origin" });
      const j = await r.json();
      if (j?.ok) setRows(j.withdrawals || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-ink-900">
          Crypto withdrawals
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Coin is held in escrow until you release it. Rejecting returns it to the
          customer&apos;s balance, network fee included.
        </p>
      </div>

      <div className="inline-flex flex-wrap rounded-full bg-night-800/50 p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cx(
              "px-4 py-2 rounded-full text-[12.5px] font-semibold transition",
              tab === t.v ? "bg-gold-500 text-ink-50" : "text-ink-500 hover:text-ink-800"
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-night-900/60 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13.5px] text-ink-500">Nothing here.</div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {rows.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => setOpen(w)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-night-800/40 text-left transition"
                >
                  <span className="h-10 w-10 shrink-0 rounded-xl bg-gold-500/12 text-gold-300 grid place-items-center text-[11px] font-bold">
                    {String(w.asset_id).slice(0, 3).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-ink-900 truncate">
                      {fmtCoin(Number(w.quantity))} · {w.network}
                    </div>
                    <div className="text-[11.5px] text-ink-400 truncate font-mono">{w.address}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13.5px] font-bold text-ink-900 tnum">
                      {fmtMoney(Number(w.eur_value) || 0)}
                    </div>
                    <div className="text-[11px] text-ink-400">
                      {w.user?.email || "—"}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <Drawer w={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function Drawer({ w, onClose, onDone }: { w: any; onClose: () => void; onDone: () => void }) {
  const [hash, setHash] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function act(action: string) {
    setBusy(action);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/crypto/withdrawals/${w.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, tx_hash: hash, reason }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Action failed");
      onDone();
    } catch (e: any) {
      setErr(e?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const pending = w.status === "pending_admin";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-night-950/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl bg-night-900 border border-ink-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-ink-900">{w.reference_id}</h2>
            <p className="mt-0.5 text-[12px] text-ink-500">
              {w.user?.first_name} {w.user?.last_name} · {w.user?.email}
              {w.user?.kyc_risk ? ` · risk ${w.user.kyc_risk}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-night-800 grid place-items-center text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-ink-200 divide-y divide-ink-200 overflow-hidden">
          <Row l="Amount" r={fmtCoin(Number(w.quantity))} />
          <Row l="Network fee" r={fmtCoin(Number(w.network_fee))} />
          <Row l="Value" r={fmtMoney(Number(w.eur_value) || 0)} />
          <Row l="Network" r={w.network} />
          <Row l="Address" r={w.address} mono />
          {w.memo && <Row l="Memo" r={w.memo} mono />}
          {w.note && <Row l="Reference" r={w.note} />}
          <Row l="Requested" r={new Date(w.created_at).toLocaleString("de-DE")} />
          <Row l="Status" r={w.status.replace("_", " ")} />
          {w.tx_hash && <Row l="Tx hash" r={w.tx_hash} mono />}
          {w.rejection_reason && <Row l="Reason" r={w.rejection_reason} />}
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(w.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-gold-300 hover:text-gold-200"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy address
        </button>

        {pending && (
          <>
            {err && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-300">
                {err}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-px" />
              <p className="text-[11.5px] leading-relaxed text-ink-600">
                Screen the destination address before releasing. Once broadcast this
                cannot be undone.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Transaction hash (optional)</label>
                <input className="field font-mono text-[12.5px]" value={hash} onChange={(e) => setHash(e.target.value)} />
              </div>
              <div>
                <label className="label">Rejection reason</label>
                <input
                  className="field"
                  placeholder="Shown to the customer"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => act("approve")} disabled={!!busy} className="btn btn-primary h-11 flex-1">
                  {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Release</>}
                </button>
                <button onClick={() => act("reject")} disabled={!!busy || !reason} className="btn btn-danger h-11 flex-1">
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ l, r, mono }: { l: string; r: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-[12px] text-ink-500 shrink-0">{l}</span>
      <span className={cx("text-[12.5px] text-ink-900 text-right break-all", mono && "font-mono text-[11.5px]")}>
        {r}
      </span>
    </div>
  );
}
