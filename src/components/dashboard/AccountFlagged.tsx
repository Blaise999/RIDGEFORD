"use client";

import { AlertTriangle, ArrowUpRight, Headset, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { useRouter } from "next/navigation";

/** Backwards-compatible legacy restriction page, without personal contact details. */
export function AccountFlagged({
  firstName,
  reason,
  currency = "EUR",
}: {
  firstName?: string | null;
  reason?: string | null;
  blockedAt?: string | null; // Retained for compatibility.
  currency?: "EUR" | "USD" | null;
}) {
  const router = useRouter();
  const coverageNote = currency === "USD"
    ? "USD account · U.S. deposit-insurance eligibility depends on the institution holding the funds. Ask Ridgeford Support Team for details."
    : "EUR account · German deposit-protection eligibility depends on the institution holding the funds. Ask Ridgeford Support Team for details.";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function openSupport() {
    window.dispatchEvent(new Event("ridgeford:open-support"));
  }

  return (
    <main className="fixed inset-0 z-40 overflow-y-auto bg-ink-50">
      <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-panel px-5 sm:px-8">
        <Logo />
        <button type="button" onClick={logout} className="text-[13px] font-semibold text-ink-500 hover:text-ink-900">
          Sign out
        </button>
      </header>
      <div className="mx-auto max-w-[780px] px-5 py-10 sm:px-8 sm:py-16">
        <section className="overflow-hidden rounded-[28px] border border-ink-200 bg-panel shadow-xl" aria-labelledby="restriction-title">
          <div className="h-1 w-full bg-brand-500" />
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-400">Access restricted</span>
            </div>
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">Ridgeford · Account notice</p>
            <h1 id="restriction-title" className="mt-3 font-display text-[34px] font-semibold leading-tight text-ink-900 sm:text-[46px]">
              Your account access is temporarily restricted.
            </h1>
            <p className="mt-4 text-[14px] leading-[1.75] text-ink-600">
              {firstName ? `Hello ${firstName}, your` : "Your"} banking services are temporarily unavailable. For more information or to appeal this restriction, contact Ridgeford Support Team using the secure in-app chat.
            </p>
            {reason?.trim() && (
              <div className="mt-7 rounded-2xl border border-ink-200 bg-ink-50 p-5">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-600">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Reason for restriction
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.7] text-ink-900">{reason}</p>
              </div>
            )}
            <p className="mt-7 text-[13px] leading-relaxed text-ink-500">
              {coverageNote}
            </p>
            <button
              type="button"
              onClick={openSupport}
              className="btn btn-primary mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 sm:w-auto"
            >
              <Headset className="h-4 w-4" aria-hidden="true" />
              Message support or appeal
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
