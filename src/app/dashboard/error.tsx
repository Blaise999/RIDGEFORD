"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Dashboard-scoped error boundary. Catches errors thrown inside the
 * dashboard layout's children and inside any client component on the
 * dashboard pages (which is where the bulk of the data-driven UI lives).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="px-5 sm:px-8 py-12">
      <div className="max-w-md mx-auto card p-6 sm:p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/10 grid place-items-center text-red-400 text-[22px] font-bold">
          !
        </div>
        <h2 className="mt-4 text-[18px] font-semibold text-ink-900">
          We couldn&apos;t load this section
        </h2>
        <p className="mt-2 text-[13.5px] text-ink-500">
          Something went wrong while loading your account. Please try again.
        </p>
        {error?.digest && (
          <p className="mt-2 text-[11px] text-ink-400 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button onClick={() => reset()} className="btn btn-brand" type="button">
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
