"use client";

import { useMemo, useState } from "react";
import { fmtMoney } from "@/lib/utils";

type Txn = {
  direction: "debit" | "credit";
  amount: number | string;
  created_at: string;
  account_type?: "checking" | "savings";
};

export function SpendingChart({
  txns,
  days = 30,
  account = "checking",
  accent = "#2f66ff",
}: {
  txns: Txn[];
  days?: number;
  account?: "checking" | "savings" | "all";
  accent?: string;
}) {
  const points = useMemo(() => bucketByDay(txns, days, account), [txns, days, account]);
  const max = Math.max(1, ...points.map((p) => p.v));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div>
      <div className="relative h-[140px] flex items-end gap-[3px]">
        {points.map((p, i) => {
          const h = Math.max(3, (p.v / max) * 128);
          const isHover = hover === i;
          return (
            <button
              key={p.d}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="flex-1 min-w-[4px] relative outline-none"
              aria-label={`${p.label}: ${p.v.toFixed(2)} euros spent`}
            >
              <span
                className="block rounded-t-md transition-all duration-150"
                style={{
                  height: `${h}px`,
                  background: isHover
                    ? accent
                    : `linear-gradient(to top, ${accent}33, ${accent}aa)`,
                }}
              />
              {isHover && (
                <span
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-night-900 text-white text-[11px] font-semibold px-2 py-1 shadow-pop"
                  style={{ zIndex: 2 }}
                >
                  {fmtMoney(p.v)} · {p.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-ink-400">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function bucketByDay(
  txns: Txn[],
  days: number,
  account: "checking" | "savings" | "all"
) {
  const now = new Date();
  const out: { d: string; v: number; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(now);
    dt.setDate(now.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    out.push({
      d: key,
      v: 0,
      label: dt.toLocaleDateString("de-DE", { day: "2-digit", month: "short" }),
    });
  }
  const idx = new Map(out.map((p, i) => [p.d, i]));
  for (const t of txns || []) {
    if (t.direction !== "debit") continue;
    if (account !== "all" && t.account_type && t.account_type !== account) continue;
    const key = new Date(t.created_at).toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i != null) out[i].v += Math.abs(Number(t.amount));
  }
  return out;
}
