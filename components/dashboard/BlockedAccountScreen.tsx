"use client";

import { ArrowUpRight, Headset, LockKeyhole, ShieldAlert } from "lucide-react";

/** The only account page shown while access is restricted. */
export function BlockedAccountScreen({
  reason,
  blockedAt,
}: {
  reason?: string | null;
  blockedAt?: string | null;
}) {
  const restrictedOn =
    blockedAt && !Number.isNaN(Date.parse(blockedAt))
      ? new Date(blockedAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  function openSupport() {
    window.dispatchEvent(new Event("ridgeford:open-support"));
  }

  return (
    <main className="mx-auto flex w-full max-w-[820px] flex-1 items-center px-4 py-12 sm:px-8 sm:py-20">
      <section aria-labelledby="restriction-title" className="w-full overflow-hidden rounded-[28px] border border-ink-200 bg-panel shadow-xl">
        <div className="h-1 w-full bg-brand-500" />
        <div className="px-6 pb-7 pt-8 sm:px-11 sm:pb-11 sm:pt-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-ink-50 text-ink-900">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-red-400">
              Access restricted
            </span>
          </div>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">Ridgeford · Account notice</p>
          <h1 id="restriction-title" className="mt-3 max-w-[650px] font-display text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] text-ink-900 sm:text-[48px]">
            Your account access is temporarily restricted.
          </h1>
          <p className="mt-5 max-w-[620px] text-[15px] leading-[1.8] text-ink-600">
            Banking services are currently unavailable on this account. You can still sign in to message Ridgeford Support and request a review.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.11em] text-ink-700">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Reason for restriction
              </div>
              {restrictedOn && <span className="text-[12px] text-ink-500">Since {restrictedOn}</span>}
            </div>
            <p className="whitespace-pre-wrap break-words px-5 py-5 text-[15px] leading-[1.75] text-ink-900 sm:px-6">
              {reason?.trim() || "Account access is currently restricted. Please contact Ridgeford Support for further details."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t border-ink-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[410px]">
              <h2 className="text-[15px] font-bold text-ink-900">Need help with this notice?</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                Support messaging remains available. Payments, transfers, balances and other account services are paused until access is restored.
              </p>
            </div>
            <button
              type="button"
              onClick={openSupport}
              className="btn btn-primary inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6"
            >
              <Headset className="h-4 w-4" aria-hidden="true" />
              Message support
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
