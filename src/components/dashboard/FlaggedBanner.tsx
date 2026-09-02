"use client";

import { AlertTriangle, Mail, Phone, X } from "lucide-react";
import { useState } from "react";

export function FlaggedBanner({
  reason,
  blockedAt,
}: {
  reason?: string | null;
  blockedAt?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const ticket = `SUP-${(blockedAt ? new Date(blockedAt).getTime() : Date.now())
    .toString(16)
    .slice(-8)
    .toUpperCase()}`;

  return (
    <div className="px-5 sm:px-8 pt-4">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/15/60 transition"
        >
          <div className="h-9 w-9 rounded-full bg-red-500/10 grid place-items-center text-red-400 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-red-200">
              Your account is under review
            </div>
            <div className="text-[12px] text-red-300/90 truncate">
              You can view your account, but transfers and other actions are paused until the review is complete.
            </div>
          </div>
          <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wide text-red-300">
            {open ? "Hide details" : "Show details"}
          </span>
        </button>

        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-red-500/30 text-[13px] text-red-200 space-y-3">
            {reason && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-300">
                  Review note
                </span>
                <div className="mt-1 text-red-300">{reason}</div>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-2 text-[12.5px]">
              <a
                href="mailto:support@ridgefordbank.eu?subject=Account%20review%20assistance"
                className="inline-flex items-center gap-2 rounded-xl bg-panel/80 hover:bg-panel border border-red-500/30 px-3 py-2 text-red-200 font-semibold"
              >
                <Mail className="h-4 w-4" /> support@ridgefordbank.eu
              </a>
              <a
                href="tel:+493055582828"
                className="inline-flex items-center gap-2 rounded-xl bg-panel/80 hover:bg-panel border border-red-500/30 px-3 py-2 text-red-200 font-semibold"
              >
                <Phone className="h-4 w-4" /> +49 30 555 82 82
              </a>
              <div className="inline-flex items-center gap-2 rounded-xl bg-panel/80 border border-red-500/30 px-3 py-2 text-red-200 font-semibold tabular-nums">
                Ref · {ticket}
              </div>
            </div>
            <p className="text-[11.5px] text-red-300/80 leading-relaxed">
              Your funds are safe and protected by the German deposit-guarantee scheme up to 100.000 €. Most reviews complete within 1–2 business days — we'll email you the moment it's done.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
