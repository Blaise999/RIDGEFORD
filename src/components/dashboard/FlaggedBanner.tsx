"use client";

import { AlertTriangle, ArrowUpRight, Headset } from "lucide-react";

/** A persistent, inline warning. Never obscures the dashboard or account history. */
export function FlaggedBanner({
  reason,
  currency: _currency = "EUR",
}: {
  reason?: string | null;
  blockedAt?: string | null;
  currency?: "EUR" | "USD" | null;
}) {
  return (
    <section className="px-5 pt-5 sm:px-8" aria-label="Account restriction notice" role="status">
      <div className="overflow-hidden rounded-2xl border border-red-500/35 bg-red-500/[0.08] shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-5 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-500">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-500">Account notice · Access restricted</p>
            <h2 className="mt-1.5 text-[19px] font-semibold leading-tight text-ink-900 sm:text-[22px]">
              Your account is in view-only mode.
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700 sm:text-[14px]">
              You can continue to review your balances, account information and transaction history. Banking actions are temporarily unavailable. To learn more or appeal this restriction, message Ridgeford Support Team.
            </p>
            <div className="mt-3 rounded-xl border border-red-500/20 bg-panel px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">Reason for restriction</p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-900">
                {reason?.trim() || "Please contact Ridgeford Support Team for more information about this restriction."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ridgeford:open-support"))}
            className="btn btn-primary inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-[13px]"
          >
            <Headset aria-hidden="true" className="h-4 w-4" />
            Message support
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
