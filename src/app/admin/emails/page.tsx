"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Loader2, Mail, Search, Send } from "lucide-react";

type Customer = { id: string; email: string; first_name: string | null; last_name: string | null };
type HistoryItem = {
  target_id: string;
  notes: string | null;
  created_at: string;
  metadata: { recipient?: string } | null;
};
function customerName(user: Customer) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

export default function AdminEmailsPage() {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recipient, setRecipient] = useState<Customer | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("userId");
    if (!id) return;
    let active = true;
    fetch(`/api/admin/emails?userId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active && d.ok && d.users?.length) setRecipient(d.users[0]); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/emails?q=${encodeURIComponent(query.trim())}`, {
          cache: "no-store", signal: controller.signal,
        });
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error || "Could not load customers");
        setCustomers(d.users || []);
        setHistory(d.history || []);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load customers");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query]);

  const ready = !!recipient && subject.trim().length >= 4 && subject.trim().length <= 120 &&
    !/[\r\n]/.test(subject) && message.trim().length >= 10 && message.trim().length <= 4000;

  async function send() {
    if (!ready || !recipient || sending) return;
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const r = await fetch("/api/admin/emails", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: recipient.id, subject: subject.trim(), message: message.trim() }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok || !d.sent) throw new Error(d.error || "Email could not be sent");
      setSuccess(`The email service accepted your message to ${recipient.email}.${d.warning ? ` ${d.warning}` : ""}`);
      setSubject("");
      setMessage("");
      setReviewing(false);
      const h = await fetch("/api/admin/emails", { cache: "no-store" }).then((res) => res.json());
      if (h.ok) setHistory(h.history || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email could not be sent");
      setReviewing(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl pt-6 pb-14 space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-500 flex gap-2 items-center"><Mail className="h-4 w-4" /> Customer correspondence</p>
        <h1 className="mt-2 text-[30px] font-bold tracking-tight text-ink-900">Send email</h1>
        <p className="mt-1 text-sm text-ink-500">Personal messages to customers on your desk, using Ridgeford's existing email design.</p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-800 flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        <section className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-ink-900">1. Choose a customer</h2>
          {recipient && (
            <div className="rounded-xl bg-brand-500/10 border border-brand-500/30 p-3 text-sm">
              <p className="text-xs text-ink-500 uppercase tracking-wide">Selected recipient</p>
              <p className="mt-1 font-bold text-ink-900">{customerName(recipient)}</p>
              <p className="text-xs text-ink-600 break-all">{recipient.email}</p>
              <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => setRecipient(null)}>Change customer</button>
            </div>
          )}
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input aria-label="Search customers" type="search" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-ink-200 bg-ink-50 outline-none focus:border-brand-500 text-sm" />
          </label>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-ink-100 divide-y divide-ink-100">
            {loading ? <p className="p-4 text-sm text-ink-500"><Loader2 className="h-4 w-4 inline animate-spin" /> Loading…</p> :
              customers.length ? customers.map((u) => (
                <button key={u.id} type="button" onClick={() => { setRecipient(u); setError(""); }}
                  className={`w-full text-left p-3 hover:bg-ink-50 ${recipient?.id === u.id ? "bg-brand-500/10" : ""}`}>
                  <span className="block text-sm font-semibold text-ink-900 truncate">{customerName(u)}</span>
                  <span className="block text-xs text-ink-500 break-all">{u.email}</span>
                </button>
              )) : <p className="p-4 text-sm text-ink-500">No matching customers.</p>}
          </div>
          <Link href="/admin/users" className="text-xs font-semibold text-ink-500 hover:text-ink-900">View all customers</Link>
        </section>
        <form className="card p-5 sm:p-7 space-y-5" onSubmit={(e) => { e.preventDefault(); if (ready) setReviewing(true); }}>
          <div>
            <h2 className="font-bold text-ink-900">2. Write your message</h2>
            <p className="text-xs text-ink-500 mt-1">Sent as Ridgeford Support Team to the customer's registered email.</p>
          </div>
          <div>
            <label htmlFor="email-subject" className="text-sm font-semibold text-ink-900">Subject</label>
            <input id="email-subject" type="text" required minLength={4} maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Your Ridgeford account update" className="mt-2 h-12 w-full px-4 rounded-xl bg-ink-50 border border-ink-200 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <div className="flex items-center justify-between"><label htmlFor="email-message" className="text-sm font-semibold text-ink-900">Message</label><span className="text-xs text-ink-400">{message.length}/4,000</span></div>
            <textarea id="email-message" required minLength={10} maxLength={4000} rows={11} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message to this customer…" className="mt-2 min-h-60 w-full px-4 py-3 rounded-xl bg-ink-50 border border-ink-200 text-sm leading-relaxed resize-y outline-none focus:border-brand-500" />
            <p className="mt-2 text-xs text-ink-500">Avoid requesting passwords, verification codes or PINs in email.</p>
          </div>
          <div className="flex justify-end pt-2 border-t border-ink-100">
            <button type="submit" disabled={!ready || sending} className="btn btn-primary h-11 px-5 disabled:opacity-50"><Mail className="h-4 w-4" /> Review email</button>
          </div>
        </form>
      </div>
      <section className="card p-5 sm:p-6 space-y-3">
        <h2 className="font-bold text-ink-900 flex items-center gap-2"><Clock3 className="w-4 h-4" /> Recent emails sent</h2>
        {history.length ? <div className="divide-y divide-ink-100">{history.map((h, i) => (
          <div key={`${h.target_id}-${h.created_at}-${i}`} className="py-3 flex flex-col sm:flex-row justify-between gap-1">
            <div><p className="text-sm font-semibold text-ink-900">{h.notes || "Customer message"}</p><p className="text-xs text-ink-500 break-all">{h.metadata?.recipient || "Customer"}</p></div>
            <span className="text-xs text-ink-500 whitespace-nowrap">{new Date(h.created_at).toLocaleString()}</span>
          </div>
        ))}</div> : <p className="text-sm text-ink-500">No manual emails sent yet.</p>}
      </section>
      {reviewing && recipient && (
        <div className="fixed inset-0 z-[110] bg-black/65 flex items-center justify-center p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="review-email-title" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-panel border border-ink-200 p-6 shadow-2xl space-y-5">
            <div><h2 id="review-email-title" className="text-xl font-bold text-ink-900">Confirm email</h2><p className="text-sm text-ink-500 mt-1">Review the recipient and message before sending.</p></div>
            <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 space-y-3">
              <div><p className="text-xs text-ink-500">To</p><p className="text-sm font-semibold break-all">{recipient.email}</p></div>
              <div><p className="text-xs text-ink-500">Subject</p><p className="text-sm font-semibold">{subject.trim()}</p></div>
              <div><p className="text-xs text-ink-500">Message</p><p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.trim()}</p></div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" type="button" disabled={sending} onClick={() => setReviewing(false)}>Back</button>
              <button className="btn btn-primary" type="button" disabled={sending} onClick={send}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? "Sending…" : "Send email"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
