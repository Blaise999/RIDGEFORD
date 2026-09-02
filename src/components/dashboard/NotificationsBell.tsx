"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cx, fmtRelativeDate } from "@/lib/utils";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

const KIND_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  transfer_submitted: { bg: "bg-amber-500/15", fg: "text-amber-300", dot: "bg-amber-500" },
  transfer_approved:  { bg: "bg-brand-500/10", fg: "text-brand-700", dot: "bg-brand-500" },
  transfer_rejected:  { bg: "bg-red-500/15", fg: "text-red-300", dot: "bg-red-500" },
  account_blocked:    { bg: "bg-red-500/15", fg: "text-red-300", dot: "bg-red-500" },
  account_unblocked:  { bg: "bg-brand-500/10", fg: "text-brand-700", dot: "bg-brand-500" },
  credit:             { bg: "bg-brand-500/10", fg: "text-brand-700", dot: "bg-brand-500" },
  debit:              { bg: "bg-ink-100", fg: "text-ink-700", dot: "bg-ink-500" },
  welcome:            { bg: "bg-brand-500/10", fg: "text-brand-700", dot: "bg-brand-500" },
  security:           { bg: "bg-amber-500/15", fg: "text-amber-300", dot: "bg-amber-500" },
  info:               { bg: "bg-ink-100", fg: "text-ink-700", dot: "bg-ink-500" },
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      if (d.ok) {
        setItems(d.notifications || []);
        setUnread(d.unread || 0);
      }
    } finally {
      setLoading(false);
    }
  }

  // initial fetch + poll every 30s
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (open && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="h-10 w-10 grid place-items-center rounded-full hover:bg-ink-50 focus-ring relative"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full bg-brand-500 text-white text-[9px] font-bold grid place-items-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="notif-panel absolute right-0 mt-2 w-[380px] max-w-[94vw] rounded-2xl bg-panel border border-ink-200 shadow-pop overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div>
                <div className="text-[15px] font-semibold text-ink-900">Notifications</div>
                <div className="text-[11.5px] text-ink-400">{unread} unread</div>
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 rounded-full text-[12px] font-semibold text-brand-600 hover:bg-brand-50 px-2.5 py-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-ink-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-ink-400">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-ink-500">You're all caught up.</div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {items.map((n) => {
                    const s = KIND_STYLE[n.kind] || KIND_STYLE.info;
                    return (
                      <li key={n.id} className={cx("flex gap-3 px-5 py-4", !n.read && "bg-brand-50/40")}>
                        <div className={cx("h-8 w-8 rounded-full grid place-items-center shrink-0", s.bg, s.fg)}>
                          <span className={cx("h-2 w-2 rounded-full", s.dot)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-semibold text-ink-900 leading-snug">{n.title}</div>
                          {n.body && <div className="text-[12.5px] text-ink-500 mt-0.5 leading-snug">{n.body}</div>}
                          <div className="text-[11px] text-ink-400 mt-1">{fmtRelativeDate(n.created_at)}</div>
                        </div>
                        {!n.read && <Check className="h-3 w-3 text-brand-500 shrink-0 mt-1.5" />}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
