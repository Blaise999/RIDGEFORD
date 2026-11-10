"use client";

import { AlertTriangle, ArrowUpRight, Headset, Info } from "lucide-react";
import { useState } from "react";

/** Legacy account-review banner. All customer assistance stays inside Ridgeford chat. */
export function FlaggedBanner({
  reason,
  currency = "EUR",
}: {
  reason?: string | null;
  blockedAt?: string | null; // Retained for compatibility with older callers.
  currency?: "EUR" | "USD" | null;
}) {
  const [open, setOpen] = useState(false);
  const coverageNote = currency === "USD"
    ? "USD account · U.S. deposit-insurance eligibility depends on the institution holding the funds. Ask Ridgeford Support Team for details."
    : "EUR account · German deposit-protection eligibility depends on the institution holding the funds. Ask Ridgeford Support Team for details.";

  function openSupport() {
    window.dispatchEvent(new Event("ridgeford:open-support"));
  }

  return (
    <section className="px-5 pt-4 sm:px-8" aria-label="Account access notice">
      <div className="overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.07]">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-red-500/10"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink-900">Your account access is restricted</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-600">
              For more information or to appeal, message Ridgeford Support Team.
            </p>
          </div>
          <span className="shrink-0 text-[12px] font-semibold text-ink-500">
            {open ? "Less" : "Details"}
          </span>
        </button>

        {open && (
          <div className="border-t border-red-500/20 px-4 pb-5 pt-4">
            {reason?.trim() && (
              <div className="rounded-xl border border-ink-200 bg-panel px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">Reason for restriction</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-900">{reason}</p>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-center gap-2 text-[12px] text-ink-600">
                <Info className="h-4 w-4 text-ink-500" aria-hidden="true" />
                {coverageNote}
              </p>
              <button
                type="button"
                onClick={openSupport}
                className="btn btn-primary inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5"
              >
                <Headset className="h-4 w-4" aria-hidden="true" />
                Message support
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
