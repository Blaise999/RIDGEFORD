"use client";

import type { SessionUser } from "@/lib/auth-types";

export function AdminTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-30 bg-panel border-b border-ink-100">
      <div className="min-h-16 flex flex-wrap items-center gap-x-3 gap-y-2 px-5 sm:px-8 py-3">
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Admin console
          </div>
          <div className="text-[13.5px] font-semibold text-ink-900 break-all">
            Signed in as {user.email}
          </div>
        </div>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand-500/10 text-brand-700 text-[11.5px] font-bold px-3 py-1.5 whitespace-nowrap shrink-0">
          Live · production mode
        </div>
      </div>
    </header>
  );
}
