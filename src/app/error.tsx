"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * App-level error boundary.
 * Without this file, ANY uncaught client-side error in a Next 14 app
 * shows the generic "Application error: a client-side exception has occurred"
 * with no info. With this in place, you see what actually broke.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error so you can grab it from the browser console
    // even on a production build.
    // eslint-disable-next-line no-console
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10 bg-panel">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 grid place-items-center text-red-400 text-[28px] font-bold">
          !
        </div>
        <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink-900">
          Something went wrong on this page
        </h1>
        <p className="mt-2 text-[14px] text-ink-500">
          We couldn&apos;t load this view. You can try again, or go back to your
          dashboard.
        </p>
        {error?.digest && (
          <p className="mt-3 text-[11px] text-ink-400 font-mono">
            Ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="btn btn-brand"
            type="button"
          >
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-ghost">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
