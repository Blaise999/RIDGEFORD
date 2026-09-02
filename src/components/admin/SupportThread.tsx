"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  Loader2,
  Send,
  Mail,
  ShieldAlert,
  ExternalLink,
  ImagePlus,
} from "lucide-react";
import { useSupportChat } from "@/lib/useSupportChat";
import { cx } from "@/lib/utils";

type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  blocked: boolean;
  created_at: string;
};

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SupportThread({ userId }: { userId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [custLoading, setCustLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    loading,
    sending,
    uploading,
    error,
    live,
    send,
    sendImage,
  } = useSupportChat({
    endpoint: `/api/admin/support/${userId}`,
    sendEndpoint: `/api/admin/support/${userId}`,
    uploadEndpoint: `/api/admin/support/upload`,
  });

  // Pull customer header once (the GET above also returns it, but a tiny
  // dedicated fetch keeps the hook generic).
  useEffect(() => {
    let on = true;
    fetch(`/api/admin/support/${userId}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (on && d?.ok) setCustomer(d.customer || null);
      })
      .catch(() => {})
      .finally(() => {
        if (on) setCustLoading(false);
      });
    return () => {
      on = false;
    };
  }, [userId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const okSent = await send(text);
    if (!okSent) setDraft(text);
    inputRef.current?.focus();
  }

  const name =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ").trim() ||
    customer?.email ||
    "Customer";

  return (
    <div className="pt-4 sm:pt-6 flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-ink-100">
        <Link
          href="/admin/support"
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-ink-100 text-ink-600"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 rounded-full bg-ink-100 grid place-items-center overflow-hidden text-[14px] font-bold text-ink-600 shrink-0">
          {customer?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={customer.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-ink-900 truncate">
              {custLoading ? "Loading…" : name}
            </span>
            {customer?.blocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-300 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
                <ShieldAlert className="h-3 w-3" />
                Blocked
              </span>
            )}
            <span
              className={cx(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                live ? "text-emerald-400" : "text-amber-400"
              )}
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  live ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
              {live ? "Live" : "Polling"}
            </span>
          </div>
          {customer && (
            <div className="text-[12px] text-ink-500 flex items-center gap-1 truncate">
              <Mail className="h-3 w-3" />
              {customer.email}
            </div>
          )}
        </div>
        {customer && (
          <Link
            href={`/admin/users/${customer.id}`}
            className="btn btn-ghost h-9 px-3 text-[12.5px] shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Profile
          </Link>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-5 space-y-3"
      >
        {loading ? (
          <div className="h-full grid place-items-center text-ink-400 text-[13.5px]">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center px-6">
            <p className="text-[13.5px] text-ink-500 max-w-sm">
              No messages yet. Send the first message — {name.split(" ")[0]} will
              see it instantly in their support widget and get a notification.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const fromAdmin = m.sender === "admin";
            return (
              <div
                key={m.id}
                className={cx(
                  "flex",
                  fromAdmin ? "justify-end" : "justify-start"
                )}
              >
                <div className="max-w-[70%]">
                  <div
                    className={cx(
                      "text-[10.5px] font-semibold mb-0.5",
                      fromAdmin ? "text-right text-ink-400 mr-1" : "text-ink-500 ml-1"
                    )}
                  >
                    {fromAdmin ? m.sender_name || "You" : m.sender_name || name}
                  </div>
                  <div
                    className={cx(
                      "rounded-2xl text-[13.5px] leading-relaxed break-words overflow-hidden",
                      m.image_url ? "p-1" : "px-4 py-2.5 whitespace-pre-wrap",
                      fromAdmin
                        ? "bg-brand-500 text-white rounded-br-md"
                        : "bg-panel border border-ink-100 text-ink-900 rounded-bl-md"
                    )}
                  >
                    {m.image_url && (
                      <a
                        href={m.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.image_url}
                          alt="attachment"
                          className="rounded-xl max-h-72 w-auto object-cover"
                          loading="lazy"
                        />
                      </a>
                    )}
                    {m.body && (
                      <div
                        className={cx(
                          m.image_url ? "px-3 py-2 whitespace-pre-wrap" : ""
                        )}
                      >
                        {m.body}
                      </div>
                    )}
                  </div>
                  <div
                    className={cx(
                      "text-[10px] text-ink-400 mt-0.5",
                      fromAdmin ? "text-right mr-1" : "ml-1"
                    )}
                  >
                    {timeLabel(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-ink-100 pt-3">
        {error && <div className="mb-2 text-[12px] text-red-400">{error}</div>}
        {uploading && (
          <div className="mb-2 text-[12px] text-ink-500 inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading image…
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await sendImage(f, draft);
              setDraft("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            className="h-12 w-12 shrink-0 rounded-xl border border-ink-200 text-ink-500 grid place-items-center hover:bg-ink-50 disabled:opacity-50"
            aria-label="Attach image"
            title="Attach an image"
          >
            <ImagePlus className="h-4.5 w-4.5" />
          </button>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={`Reply to ${name.split(" ")[0]}…`}
            className="flex-1 resize-none max-h-36 rounded-xl border border-ink-200 bg-panel px-3.5 py-3 text-[14px] outline-none focus:border-brand-500"
          />
          <button
            onClick={submit}
            disabled={sending || uploading || !draft.trim()}
            className="btn btn-brand h-12 px-5 shrink-0 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
