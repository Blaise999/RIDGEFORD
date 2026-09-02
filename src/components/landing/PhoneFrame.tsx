"use client";

import { cx } from "@/lib/utils";

/**
 * A clean iPhone-like frame. We intentionally keep the chrome neutral so it
 * reads as an anonymous "app preview" — very N26.
 */
export function PhoneFrame({
  children,
  className,
  tone = "light",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cx(
        "relative mx-auto w-[300px] h-[610px] sm:w-[320px] sm:h-[650px]",
        className
      )}
    >
      {/* Outer bezel */}
      <div
        className={cx(
          "absolute inset-0 rounded-[46px] shadow-[0_25px_60px_-20px_rgba(10,12,16,0.35),0_10px_25px_rgba(10,12,16,0.10)]",
          tone === "dark"
            ? "bg-gradient-to-b from-night-800 to-night-900 ring-1 ring-ink-800"
            : "bg-gradient-to-b from-night-900 to-night-800 ring-1 ring-gold-500/10"
        )}
      />
      {/* Inner screen */}
      <div className="absolute inset-[6px] rounded-[40px] overflow-hidden bg-panel">
        {/* Dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 h-6 w-24 rounded-full bg-black" />
        {/* Status bar */}
        <div className="absolute top-2.5 left-0 right-0 z-10 flex justify-between px-6 text-[10.5px] font-semibold text-ink-700 pointer-events-none">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 9V7M4 9V5M7 9V3M10 9V1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M7 8.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
              <path d="M3 5.5a5 5 0 018 0M1 3.5a8 8 0 0112 0" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
              <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor"/>
              <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor"/>
              <rect x="20" y="3" width="1.5" height="4" rx="0.75" fill="currentColor"/>
            </svg>
          </span>
        </div>

        {children}
      </div>

      {/* Side buttons */}
      <span className="absolute -left-[2px] top-[120px] h-10 w-[3px] rounded-r-full bg-night-800/60" />
      <span className="absolute -left-[2px] top-[170px] h-16 w-[3px] rounded-r-full bg-night-800/60" />
      <span className="absolute -right-[2px] top-[150px] h-20 w-[3px] rounded-l-full bg-night-800/60" />
    </div>
  );
}
