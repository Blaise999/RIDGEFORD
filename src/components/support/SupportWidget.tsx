"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Headset,
} from "lucide-react";
import { useSupportChat } from "@/lib/useSupportChat";
import { cx } from "@/lib/utils";

function timeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function SupportWidget() {
  const [open, setOpen] = useState(false);
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
    endpoint: "/api/support",
    sendEndpoint: "/api/support/messages",
    uploadEndpoint: "/api/support/upload",
  });

  const lastAdminAt = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "admin") return messages[i].created_at;
    }
    return null;
  })();

  // Unread = admin messages that arrived while the panel was closed
  const [seenAdminAt, setSeenAdminAt] = useState<string | null>(null);
  const unread =
    !open && lastAdminAt && (!seenAdminAt || lastAdminAt > seenAdminAt);

  useEffect(() => {
    if (open && lastAdminAt) setSeenAdminAt(lastAdminAt);
  }, [open, lastAdminAt]);

  // Mark read on the server when opening
  useEffect(() => {
    if (open) {
      fetch("/api/support/read", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    }
  }, [open]);

  // Autoscroll to newest
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function submit() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const okSent = await send(text);
    if (!okSent) setDraft(text);
    inputRef.current?.focus();
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className={cx(
          "fixed z-50 bottom-5 right-5 h-14 w-14 rounded-full grid place-items-center text-white shadow-2xl transition-transform hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-brand-500 to-brand-600"
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}

        {unread && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-50 bottom-24 right-5 w-[min(94vw,392px)] h-[min(72vh,560px)] flex flex-col rounded-2xl bg-panel shadow-2xl border border-ink-100 overflow-hidden"
          role="dialog"
          aria-label="Support chat"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-br from-night-900 to-night-800 text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/15 grid place-items-center">
              <Headset className="h-4.5 w-4.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold">
                Ridgeford Capital Bank Support
              </div>

              <div className="text-[11.5px] text-white/70 flex items-center gap-1.5">
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    live ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
                {live
                  ? "Live · we usually reply in minutes"
                  : "We usually reply in minutes"}
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-ink-50"
          >
            {loading ? (
              <div className="h-full grid place-items-center text-ink-400 text-[13px]">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full grid place-items-center text-center px-6">
                <div>
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-600 grid place-items-center">
                    <MessageCircle className="h-6 w-6" />
                  </div>

                  <p className="mt-3 text-[13.5px] font-semibold text-ink-900">
                    How can we help?
                  </p>

                  <p className="mt-1 text-[12.5px] text-ink-500">
                    Send us a message and a Ridgeford Capital Bank agent will reply here.
                    You&apos;ll also get a notification.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender === "user";

                return (
                  <div
                    key={m.id}
                    className={cx("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div className="max-w-[78%]">
                      {!mine && (
                        <div className="text-[10.5px] font-semibold text-ink-500 mb-0.5 ml-1">
                          {m.sender_name || "Support"}
                        </div>
                      )}

                      <div
                        className={cx(
                          "rounded-2xl text-[13.5px] leading-relaxed break-words overflow-hidden",
                          m.image_url
                            ? "p-1"
                            : "px-3.5 py-2 whitespace-pre-wrap",
                          mine
                            ? "bg-brand-500 text-white rounded-br-md"
                            : "bg-panel text-ink-900 border border-ink-100 rounded-bl-md"
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
                              className="rounded-xl max-h-60 w-auto object-cover"
                              loading="lazy"
                            />
                          </a>
                        )}

                        {m.body && (
                          <div
                            className={cx(
                              m.image_url
                                ? "px-2.5 py-1.5 whitespace-pre-wrap"
                                : ""
                            )}
                          >
                            {m.body}
                          </div>
                        )}
                      </div>

                      <div
                        className={cx(
                          "text-[10px] text-ink-400 mt-0.5",
                          mine ? "text-right mr-1" : "ml-1"
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
          <div className="border-t border-ink-100 bg-panel p-3">
            {error && (
              <div className="mb-2 text-[12px] text-red-400">{error}</div>
            )}

            {uploading && (
              <div className="mb-2 text-[12px] text-ink-500 inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading image…
              </div>
            )}

            <div className="flex items-end gap-1.5">
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
                className="h-10 w-5 shrink-0 grid place-items-center text-[19px] leading-none font-light text-ink-300 hover:text-ink-500 disabled:opacity-30 transition-colors"
                aria-label="Attach image"
                title="Attach image"
              >
                +
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
                placeholder="Type a message…"
                className="flex-1 resize-none max-h-28 rounded-xl border border-ink-200 bg-panel px-3 py-2.5 text-[13.5px] outline-none focus:border-brand-500"
              />

              <button
                onClick={submit}
                disabled={sending || uploading || !draft.trim()}
                className="h-10 w-10 shrink-0 rounded-xl bg-brand-500 text-white grid place-items-center disabled:opacity-50 hover:bg-brand-600"
                aria-label="Send"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}