"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Clock, Loader2, ChevronRight, Mail, MapPin, Briefcase, IdCard } from "lucide-react";
import { cx, fmtDate } from "@/lib/utils";

type App = {
  id: string;
  email: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  employment_status: string | null;
  employer: string | null;
  occupation: string | null;
  monthly_income: string | null;
  source_of_funds: string | null;
  tax_id: string | null;
  id_document_type: string | null;
  id_document_number: string | null;
  onboarding_status: string;
  rejection_reason: string | null;
  created_at: string;
};

const TABS: { id: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ALL"; label: string }[] = [
  { id: "PENDING_REVIEW", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
];

export default function AdminApplicationsPage() {
  const [tab, setTab] = useState<"PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ALL">("PENDING_REVIEW");
  const [items, setItems] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<App | null>(null);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/applications?status=${tab}`);
      const d = await r.json();
      if (d.ok) setItems(d.applications);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab]);

  async function act(id: string, action: "approve" | "reject") {
    setErr(null);
    let reason: string | null = null;
    if (action === "reject") {
      reason = prompt("Reason for rejection (emailed to applicant):", "We couldn't verify some of the information provided.");
      if (reason === null) return;
    }
    setBusy(action);
    try {
      const r = await fetch(`/api/admin/applications/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      setSelected(null);
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pt-4 sm:pt-6 space-y-5 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-ink-900">
            Applications
          </h1>
          <p className="text-[13px] text-ink-400 mt-0.5">
            Review new account applications. Approving issues a German IBAN and opens the account.
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-full bg-night-800/50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "h-9 px-4 text-[12.5px] font-semibold rounded-full transition",
              tab === t.id ? "bg-panel text-ink-900" : "text-ink-300 hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-night-900/60 overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-[13px] text-ink-400">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading applications…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-[13.5px] text-ink-400">
            No applications in this state.
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {items.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setSelected(a)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-night-800/40 text-left transition"
                >
                  <StatusDot status={a.onboarding_status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-ink-900 truncate">
                      {[a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div className="text-[12px] text-ink-400 truncate">
                      {a.email} · {a.city || "—"} · Submitted {fmtDate(a.created_at)}
                    </div>
                  </div>
                  <span className={cx(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    a.onboarding_status === "PENDING_REVIEW" && "bg-amber-500/15 text-amber-300",
                    a.onboarding_status === "APPROVED" && "bg-brand-500/15 text-brand-300",
                    a.onboarding_status === "REJECTED" && "bg-red-500/15 text-red-300",
                  )}>
                    {a.onboarding_status.replace("_", " ")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl my-10 rounded-3xl bg-night-900 border border-ink-200 text-ink-900 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Application
                </div>
                <h2 className="mt-1 text-[24px] font-bold tracking-tight">
                  {[selected.first_name, selected.middle_name, selected.last_name].filter(Boolean).join(" ")}
                </h2>
                <div className="text-[13px] text-ink-400 mt-0.5">{selected.email}</div>
              </div>
              <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-night-800 grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-5 text-[13.5px]">
              <Section Icon={IdCard} title="Identity">
                <Row k="Date of birth" v={selected.date_of_birth} />
                <Row k="Place of birth" v={selected.place_of_birth} />
                <Row k="Nationality" v={selected.nationality} />
                <Row k="Tax-ID" v={selected.tax_id} />
                <Row k="ID type" v={selected.id_document_type === "passport" ? "Passport" : "German ID card"} />
                <Row k="ID number" v={selected.id_document_number} />
              </Section>
              <Section Icon={MapPin} title="Address">
                <Row k="Street" v={`${selected.street || ""} ${selected.street_number || ""}`.trim()} />
                <Row k="City" v={`${selected.postal_code || ""} ${selected.city || ""}`.trim()} />
                <Row k="Country" v={selected.country} />
                <Row k="Phone" v={selected.phone} />
              </Section>
              <Section Icon={Briefcase} title="Employment">
                <Row k="Status" v={selected.employment_status} />
                <Row k="Employer" v={selected.employer} />
                <Row k="Occupation" v={selected.occupation} />
                <Row k="Income" v={selected.monthly_income} />
                <Row k="Source of funds" v={selected.source_of_funds} />
              </Section>
              <Section Icon={Mail} title="Status">
                <Row k="Submitted" v={fmtDate(selected.created_at)} />
                <Row k="State" v={selected.onboarding_status.replace("_", " ")} />
                {selected.rejection_reason && <Row k="Rejection" v={selected.rejection_reason} />}
              </Section>
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-[13px] p-3">
                {err}
              </div>
            )}

            {selected.onboarding_status === "PENDING_REVIEW" && (
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => act(selected.id, "reject")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 rounded-full h-10 px-5 border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-semibold text-[13.5px] disabled:opacity-50"
                >
                  {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  onClick={() => act(selected.id, "approve")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 rounded-full h-10 px-5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[13.5px] disabled:opacity-50"
                >
                  {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve & issue IBAN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "PENDING_REVIEW") return <Clock className="h-5 w-5 text-amber-400" />;
  if (status === "APPROVED") return <Check className="h-5 w-5 text-brand-400" />;
  if (status === "REJECTED") return <X className="h-5 w-5 text-red-400" />;
  return <Clock className="h-5 w-5 text-ink-400" />;
}

function Section({
  Icon, title, children,
}: { Icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-400 mb-2">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="rounded-xl border border-ink-200 bg-night-800/30 divide-y divide-ink-200">
        {children}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <span className="text-[12.5px] text-ink-400">{k}</span>
      <span className="text-[13px] font-semibold text-ink-900 text-right break-all">{v || "—"}</span>
    </div>
  );
}
