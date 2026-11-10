"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Headset, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useSupportChat } from "@/lib/useSupportChat";

function displayTime(date: string) {
  const time = new Date(date);
  return Number.isNaN(time.valueOf()) ? "" : time.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

/** A real route, available even when an account is restricted. */
export default function CustomerSupportPage() {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sending, error, reload, send } = useSupportChat({
    endpoint: "/api/support",
    sendEndpoint: "/api/support/messages",
    uploadEndpoint: "/api/support/upload",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    const success = await send(message);
    if (success) setDraft("");
  }

  return (
    <section className="mx-auto max-w-3xl pb-8" aria-label="Secure support messaging">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 text-ink-700 hover:bg-panel" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600"><Headset className="h-5 w-5" /></span>
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Ridgeford Support Team</h1>
          <p className="text-xs text-ink-500">Secure account assistance and restriction appeals</p>
        </div>
      </div>

      <div className="flex min-h-[450px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-panel shadow-sm">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3 text-xs text-ink-600">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          Your messages are sent through Ridgeford's secure support channel.
        </div>

        <div className="min-h-[260px] flex-1 space-y-4 overflow-y-auto bg-ink-50 px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-ink-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…</div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-600">Write a message below to contact Ridgeford Support Team.</p>
          ) : messages.map((message) => (
            <div key={message.id} className={message.sender === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={message.sender === "user"
                ? "max-w-[87%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-3 text-white sm:max-w-[75%]"
                : "max-w-[87%] rounded-2xl rounded-bl-sm border border-ink-200 bg-panel px-4 py-3 text-ink-900 sm:max-w-[75%]"}>
                {message.sender === "admin" && <p className="mb-1 text-xs font-semibold">Ridgeford Support Team</p>}
                {message.body && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>}
                {message.image_url && <a className="mt-1 block text-sm underline" href={message.image_url} target="_blank" rel="noopener noreferrer">View attachment</a>}
                <p className="mt-2 text-[10px] opacity-70">{displayTime(message.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div role="alert" className="mx-4 my-2 flex items-start justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            <span>{error}</span>
            <button type="button" onClick={() => { void reload(); }} className="inline-flex shrink-0 items-center gap-1 font-semibold underline"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
          </div>
        )}

        <form onSubmit={submit} className="flex items-end gap-3 border-t border-ink-100 p-3 sm:p-4">
          <label htmlFor="ridgeford-support-message" className="sr-only">Message Ridgeford Support Team</label>
          <textarea id="ridgeford-support-message" rows={2} maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe your question or request a review…" className="min-h-12 flex-1 resize-y rounded-xl border border-ink-200 bg-panel px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500" />
          <button type="submit" disabled={sending || !draft.trim()} className="btn btn-primary inline-flex h-12 shrink-0 items-center gap-2 rounded-xl px-4 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
