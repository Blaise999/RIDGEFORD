"use client";

import { useMemo } from "react";
import { fmtMoney } from "@/lib/utils";

type Txn = {
  direction: "debit" | "credit";
  amount: number | string;
  category: string | null;
  account_type?: "checking" | "savings";
};

const COLORS: Record<string, string> = {
  Groceries: "bg-brand-500",
  Dining: "bg-night-900",
  Transport: "bg-amber-400",
  Shopping: "bg-azure-500",
  Subscriptions: "bg-pink-500",
  Bills: "bg-purple-500",
  Travel: "bg-sky-500",
  Entertainment: "bg-rose-500",
  Health: "bg-emerald-500",
  Fee: "bg-ink-500",
  Transfer: "bg-ink-400",
};

export function CategoryBreakdown({
  txns,
  account = "checking",
}: {
  txns: Txn[];
  account?: "checking" | "savings" | "all";
}) {
  const { items, total } = useMemo(() => {
    const map = new Map<string, number>();
    let t = 0;
    for (const tx of txns || []) {
      if (tx.direction !== "debit") continue;
      if (account !== "all" && tx.account_type && tx.account_type !== account) continue;
      const k = tx.category || "Other";
      const amt = Math.abs(Number(tx.amount));
      map.set(k, (map.get(k) || 0) + amt);
      t += amt;
    }
    const sorted = Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    return { items: sorted, total: t };
  }, [txns, account]);

  if (items.length === 0) {
    return <div className="text-[13.5px] text-ink-400">No spending in this period yet.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
        return (
          <div key={c.name}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink-900">{c.name}</span>
              <span className="text-[12.5px] text-ink-500 tabular-nums">{fmtMoney(c.amount)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-ink-100 overflow-hidden">
              <span
                className={`block h-full rounded-full transition-all duration-700 ease-out ${COLORS[c.name] || "bg-ink-400"}`}
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
