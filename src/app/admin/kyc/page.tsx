"use client";

import { useEffect, useMemo, useState } from "react";
import { countryName, EMPLOYMENT_STATUS, INCOME_BANDS, SOURCE_OF_FUNDS, TURNOVER_BANDS } from "@/lib/kyc";
import { cx } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

const TABS = [
  { v: "submitted", l: "New" },
  { v: "in_review", l: "In review" },
  { v: "more_info", l: "Waiting on customer" },
  { v: "approved", l: "Approved" },
  { v: "rejected", l: "Rejected" },
  { v: "all", l: "All" },
];

export default function AdminKycPage() {
  const [tab, setTab] = useState("submitted");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/kyc?status=${tab}`, { credentials: "same-origin" });
      const j = await r.json();
      if (j?.ok) setRows(j.applications || []);
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
          Identity verification
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Customer due diligence files, ordered newest first. Highest risk scores need a
          second pair of eyes.
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[13.5px] text-ink-500">
            Nothing in this queue.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setOpenId(a.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-night-800/40 text-left transition"
                >
                  <RiskDot rating={a.risk_rating} score={a.risk_score} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-ink-900 truncate">
                      {[a.legal_first_name, a.legal_last_name].filter(Boolean).join(" ") || a.user?.email}
                    </div>
                    <div className="text-[11.5px] text-ink-400 truncate">
                      {a.user?.email} · {countryName(a.residence_country)} ·{" "}
                      {a.documents?.length || 0} document{(a.documents?.length || 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <StatusPill status={a.status} />
                    <div className="mt-1 text-[11px] text-ink-400">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("de-DE") : "—"}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openId && <ReviewDrawer id={openId} onClose={() => setOpenId(null)} onDone={() => { setOpenId(null); load(); }} />}
    </div>
  );
}

function RiskDot({ rating, score }: { rating?: string; score?: number }) {
  const map: Record<string, string> = {
    low: "bg-up/15 text-up",
    medium: "bg-amber-500/15 text-amber-300",
    high: "bg-red-500/15 text-red-300",
  };
  return (
    <span
      className={cx(
        "h-10 w-10 shrink-0 rounded-xl grid place-items-center text-[11px] font-bold",
        map[rating || "low"] || "bg-ink-100 text-ink-500"
      )}
      title={`Risk score ${score ?? "—"}`}
    >
      {score ?? "—"}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-brand-500/15 text-brand-600",
    in_review: "bg-amber-500/15 text-amber-300",
    more_info: "bg-amber-500/15 text-amber-300",
    approved: "bg-up/15 text-up",
    rejected: "bg-red-500/15 text-red-300",
    draft: "bg-ink-100 text-ink-500",
  };
  return (
    <span className={cx("inline-block rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide", map[status] || "bg-ink-100 text-ink-500")}>
      {status.replace("_", " ")}
    </span>
  );
}

function ReviewDrawer({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/kyc/${id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setData(j);
          setNotes(j.application?.review_notes || "");
        }
      })
      .catch(() => setErr("Could not load this file"));
  }, [id]);

  const a = data?.application;
  const u = data?.user;

  const facts = useMemo(() => {
    if (!a) return [];
    return [
      ["Legal name", [a.title, a.legal_first_name, a.legal_middle_name, a.legal_last_name].filter(Boolean).join(" ")],
      ["Born", `${a.date_of_birth || "—"} · ${a.place_of_birth || "—"}, ${countryName(a.country_of_birth)}`],
      ["Nationality", [countryName(a.nationality), a.second_nationality ? countryName(a.second_nationality) : null].filter(Boolean).join(" / ")],
      ["Phone", a.phone],
      ["Address", [a.street, a.street_number, a.address_extra, a.postal_code, a.city, countryName(a.residence_country)].filter(Boolean).join(" · ")],
      ["Resident since", a.resident_since],
      ["Tax residence", `${countryName(a.tax_residence_country)} · TIN ${a.tax_id || a.tin_unavailable_reason || "—"}`],
      ["Second tax residence", a.second_tax_residence ? `${countryName(a.second_tax_residence)} · ${a.second_tax_id || "—"}` : "None"],
      ["US person", a.us_person ? `Yes · ${a.us_tin || "no TIN given"}` : "No"],
      ["Employment", `${EMPLOYMENT_STATUS.find((x) => x.v === a.employment_status)?.l || "—"}${a.occupation ? ` · ${a.occupation}` : ""}${a.employer_name ? ` @ ${a.employer_name}` : ""}`],
      ["Industry", a.industry],
      ["Income", INCOME_BANDS.find((x) => x.v === a.annual_income_band)?.l],
      ["Net worth", a.net_worth_band],
      ["Source of funds", (a.source_of_funds || []).map((v: string) => SOURCE_OF_FUNDS.find((s) => s.v === v)?.l || v).join(", ")],
      ["Source of wealth", a.source_of_wealth],
      ["Expected in / out", `${TURNOVER_BANDS.find((x) => x.v === a.expected_monthly_inflow)?.l || "—"} / ${TURNOVER_BANDS.find((x) => x.v === a.expected_monthly_outflow)?.l || "—"}`],
      ["Expected countries", (a.expected_countries || []).map(countryName).join(", ") || "EEA only"],
      ["Crypto experience", a.crypto_experience],
      ["PEP", a.is_pep ? `Yes · ${a.pep_role} (${countryName(a.pep_country)}) ${a.pep_since || ""}` : "No"],
      ["Associate PEP", a.associate_pep ? a.associate_pep_detail : "No"],
      ["Acting for", a.acting_own_behalf === false ? a.third_party_detail : "Themselves"],
      ["ID document", `${a.id_document_type || "—"} ${a.id_document_number || ""} · ${countryName(a.id_issuing_country)} · expires ${a.id_expiry_date || "—"}`],
      ["Signed", a.signed_at ? `${a.signature_name} · ${new Date(a.signed_at).toLocaleString("de-DE")}` : "—"],
      ["Audit", [a.ip_address, a.locale].filter(Boolean).join(" · ")],
    ] as [string, any][];
  }, [a]);

  async function act(action: string) {
    setBusy(action);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/kyc/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, reason, notes }),
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night-950/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-3xl my-8 rounded-3xl bg-night-900 border border-ink-200 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {!data ? (
          <div className="py-16 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-[20px] font-bold text-ink-900">
                    {[a.legal_first_name, a.legal_last_name].filter(Boolean).join(" ")}
                  </h2>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  {u?.email} · applied {a.submitted_at ? new Date(a.submitted_at).toLocaleString("de-DE") : "—"}
                </p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-night-800 grid place-items-center text-ink-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* risk */}
            <div className={cx(
              "mt-5 rounded-2xl border p-4",
              a.risk_rating === "high" ? "border-red-500/30 bg-red-500/[0.07]"
                : a.risk_rating === "medium" ? "border-amber-500/30 bg-amber-500/[0.07]"
                : "border-up/25 bg-up/[0.06]"
            )}>
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-ink-900">
                {a.risk_rating === "low" ? <ShieldCheck className="h-4 w-4 text-up" /> : <ShieldAlert className="h-4 w-4 text-amber-300" />}
                Risk {a.risk_rating || "—"} · score {a.risk_score ?? "—"}/100
              </div>
              {Array.isArray(a.risk_factors) && a.risk_factors.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {a.risk_factors.map((f: any, i: number) => (
                    <li key={i} className="rounded-full bg-night-800 px-2.5 py-1 text-[11px] text-ink-600">
                      {f.label} <span className="text-ink-400">+{f.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* documents */}
            <div className="mt-5">
              <h3 className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-ink-500">Documents</h3>
              <div className="mt-2 grid sm:grid-cols-2 gap-2">
                {(data.documents || []).length === 0 && (
                  <p className="text-[12.5px] text-ink-400">No documents uploaded.</p>
                )}
                {(data.documents || []).map((d: any) => (
                  <a
                    key={d.id}
                    href={d.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 hover:border-gold-500/40 transition"
                  >
                    <FileText className="h-4 w-4 text-ink-400 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink-900 capitalize">
                        {String(d.kind).replace(/_/g, " ")}
                      </span>
                      <span className="block text-[11px] text-ink-400 truncate">{d.file_name}</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                Links are signed and expire in 10 minutes.
              </p>
            </div>

            {/* facts */}
            <div className="mt-5 rounded-xl border border-ink-200 divide-y divide-ink-200 overflow-hidden">
              {facts.map(([l, v]) => (
                <div key={l} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <span className="text-[12px] text-ink-500 shrink-0 w-40">{l}</span>
                  <span className="text-[12.5px] text-ink-900 text-right break-words">
                    {v || <span className="text-ink-400">—</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* decision */}
            {["submitted", "in_review", "more_info"].includes(a.status) && (
              <div className="mt-6 space-y-3">
                {err && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[12.5px] text-red-300">
                    {err}
                  </div>
                )}

                <div>
                  <label className="label">Internal notes</label>
                  <textarea rows={2} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div>
                  <label className="label">Message to the customer</label>
                  <textarea
                    rows={2}
                    className="field"
                    placeholder="Required when asking for more information or rejecting"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => act("approve")} disabled={!!busy} className="btn btn-primary h-11">
                    {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Approve &amp; open account</>}
                  </button>
                  <button onClick={() => act("more_info")} disabled={!!busy || !reason} className="btn btn-ghost h-11">
                    <AlertTriangle className="h-4 w-4" /> Request more info
                  </button>
                  <button onClick={() => act("reject")} disabled={!!busy || !reason} className="btn btn-danger h-11">
                    <X className="h-4 w-4" /> Reject
                  </button>
                  {a.status === "submitted" && (
                    <button onClick={() => act("in_review")} disabled={!!busy} className="btn btn-ghost h-11">
                      Mark in review
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
