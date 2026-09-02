"use client";

import { cx } from "@/lib/utils";

export function AccountSwitcher({
  value,
  onChange,
  size = "md",
}: {
  value: "checking" | "savings";
  onChange: (v: "checking" | "savings") => void;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  const px = size === "sm" ? "px-3" : "px-4";
  const text = size === "sm" ? "text-[12.5px]" : "text-[13.5px]";
  return (
    <div className={cx("inline-flex rounded-full bg-ink-50 p-1", h)}>
      <button
        onClick={() => onChange("checking")}
        className={cx(
          "rounded-full font-semibold transition",
          px, text,
          value === "checking" ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
        )}
      >
        Checking
      </button>
      <button
        onClick={() => onChange("savings")}
        className={cx(
          "rounded-full font-semibold transition",
          px, text,
          value === "savings" ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900"
        )}
      >
        Savings
      </button>
    </div>
  );
}
