"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Plus,
  Globe2,
  CreditCard,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  PiggyBank,
} from "lucide-react";
import { fmtMoney, fmtRelativeDate, maskIban, cx } from "@/lib/utils";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { CryptoBar } from "@/components/dashboard/CryptoBar";

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  iban: string | null;
  card_last4: string | null;
  balance_checking: number | string;
  balance_savings: number | string;
};

type Txn = {
  id: string;
  direction: "debit" | "credit";
  amount: number | string;
  currency: string;
  category: string | null;
  rail: string | null;
  counterparty_name: string | null;
  merchant: string | null;
  description: string | null;
  account_type: "checking" | "savings";
  created_at: string;
  status: string;
};

type Transfer = {
  id: string;
  reference_id: string;
  beneficiary_name: string;
  amount: number | string;
  currency: string;
  rail: string | null;
  status: string;
  created_at: string;
};

// Safe number coercion: never propagate NaN into rendered text.
function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

// Defensive timestamp parser. Returns NaN for nullish/invalid dates so
// downstream comparisons evaluate to false instead of throwing.
function ts(v: unknown): number {
  if (!v) return NaN;
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export default function DashboardOverview() {
  const [me, setMe] = useState<User | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [account, setAccount] = useState<"checking" | "savings">("checking");
  const [hideBalance, setHideBalance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadErr(null);
    try {
      const [a, b, c] = await Promise.all([
        fetch("/api/auth/me", { credentials: "same-origin" })
          .then((r) => r.json())
          .catch(() => ({ ok: false })),
        fetch("/api/transactions?sinceDays=60", { credentials: "same-origin" })
          .then((r) => r.json())
          .catch(() => ({ ok: false })),
        fetch("/api/transfers", { credentials: "same-origin" })
          .then((r) => r.json())
          .catch(() => ({ ok: false })),
      ]);
      if (a?.ok && a.user) setMe(a.user);
      if (b?.ok && Array.isArray(b.transactions)) setTxns(b.transactions);
      if (c?.ok && Array.isArray(c.transfers)) setTransfers(c.transfers);

      // If the /me call failed outright, surface it so the page isn't blank.
      if (!a?.ok) {
        setLoadErr(
          "We couldn't load your account details. Please refresh the page."
        );
      }
    } catch (e: any) {
      // Final safety net — should never get here, but better than throwing
      // into the dashboard's error boundary.
      setLoadErr(e?.message || "Failed to load your dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Derived KPIs for the selected account
  const accountTxns = useMemo(
    () => (txns || []).filter((t) => t && t.account_type === account),
    [txns, account]
  );

  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return accountTxns.filter((t) => {
      const t0 = ts(t.created_at);
      return Number.isFinite(t0) && t0 >= cutoff;
    });
  }, [accountTxns]);

  const spent30 = last30
    .filter((t) => t.direction === "debit")
    .reduce((s, t) => s + num(t.amount), 0);
  const recv30 = last30
    .filter((t) => t.direction === "credit")
    .reduce((s, t) => s + num(t.amount), 0);

  // vs the previous 30 days
  const prev30 = useMemo(() => {
    const cutoff = Date.now() - 60 * 86400000;
    const cutoff2 = Date.now() - 30 * 86400000;
    return accountTxns.filter((t) => {
      const t0 = ts(t.created_at);
      return Number.isFinite(t0) && t0 >= cutoff && t0 < cutoff2;
    });
  }, [accountTxns]);
  const spentPrev = prev30
    .filter((t) => t.direction === "debit")
    .reduce((s, t) => s + num(t.amount), 0);
  const delta = spentPrev > 0 ? ((spent30 - spentPrev) / spentPrev) * 100 : 0;

  const currentBalance =
    account === "checking"
      ? num(me?.balance_checking)
      : num(me?.balance_savings);
  const otherBalance =
    account === "checking"
      ? num(me?.balance_savings)
      : num(me?.balance_checking);

  const recentTxns = accountTxns.slice(0, 8);
  const pendingTransfers = (transfers || [])
    .filter((t) => t && t.status === "pending_admin")
    .slice(0, 4);

  return (
    <div className="pt-4 sm:pt-6 pb-8 space-y-4 sm:space-y-6">
      {/* Inline error banner so a failed fetch doesn't black out the page */}
      {loadErr && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
          {loadErr}
        </div>
      )}

      {/* Greeting + switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="dash-h1 text-[24px] sm:text-[30px] text-ink-900">
            Hi, {me?.first_name || "there"}
          </h1>
          <p className="text-[12.5px] sm:text-[13.5px] text-ink-500 mt-0.5">
            Here&apos;s what&apos;s happening with your money.
          </p>
        </div>
        <AccountSwitcher value={account} onChange={setAccount} />
      </div>

      {/*
        The old hero was a blue gradient card with two blurred glows — the
        visual language of a 2019 neobank. This is a statement panel: near
        black, a hairline rule, the figure set in the display face at a size
        that means it. The account identity sits above it in mono, the way a
        statement header actually reads.
      */}
      <section className="acct-hero relative overflow-hidden rounded-2xl">
        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] acct-hero__label">
                {account === "checking" ? "Current account" : "Savings account"}
              </div>
              <div className="mt-1.5 font-mono text-[11px] acct-hero__muted tnum truncate">
                {maskIban(me?.iban || "")}
              </div>
            </div>
            <button
              onClick={() => setHideBalance((v) => !v)}
              aria-label={hideBalance ? "Show balance" : "Hide balance"}
              className="acct-hero__btn h-9 w-9 shrink-0 grid place-items-center rounded-lg transition"
            >
              {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="stat-figure acct-hero__figure text-[44px] sm:text-[62px] leading-none">
              {hideBalance ? "••••••" : fmtMoney(currentBalance).replace("€", "").trim()}
            </span>
            {!hideBalance && (
              <span className="font-display text-[22px] sm:text-[28px] acct-hero__label">€</span>
            )}
          </div>

          <div className="mt-4 pt-4 acct-hero__rule flex flex-wrap items-center gap-x-7 gap-y-2">
            <span className="text-[11.5px]">
              <span className="block text-[10px] uppercase tracking-[0.16em] acct-hero__muted">
                Received · 30 days
              </span>
              <span className="mt-0.5 block tnum acct-hero__value">
                {hideBalance ? "•••" : fmtMoney(recv30)}
              </span>
            </span>
            <span className="text-[11.5px]">
              <span className="block text-[10px] uppercase tracking-[0.16em] acct-hero__muted">
                Available now
              </span>
              <span className="mt-0.5 block tnum acct-hero__value">
                {hideBalance ? "•••" : fmtMoney(currentBalance)}
              </span>
            </span>
            <span className="text-[11.5px]">
              <span className="block text-[10px] uppercase tracking-[0.16em] acct-hero__muted">
                Protection
              </span>
              <span className="mt-0.5 block acct-hero__value">100.000 €</span>
            </span>
          </div>

          {/* Actions read as a toolbar on the panel, not as four floating chips */}
          <div className="acct-hero__tools mt-5 grid grid-cols-4 gap-px rounded-xl overflow-hidden">
          <ActionTile Icon={Send} label="Send" href="/dashboard/transfer" />
            <ActionTile Icon={Globe2} label="Int'l" href="/dashboard/transfer/international" />
            <ActionTile Icon={Plus} label="Top up" href="/dashboard/transfer" />
            <ActionTile Icon={PiggyBank} label="Vault" href="/dashboard/vault" />
          </div>

          {/* The other account, as a ledger row rather than a frosted card */}
          <button
            onClick={() => setAccount(account === "checking" ? "savings" : "checking")}
            className="acct-hero__switch mt-3 w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="acct-hero__chip h-8 w-8 shrink-0 rounded-lg grid place-items-center">
                <PiggyBank className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium acct-hero__value">
                  {account === "checking" ? "Savings account" : "Current account"}
                </span>
                <span className="block text-[10.5px] uppercase tracking-[0.14em] acct-hero__muted">
                  Switch
                </span>
              </span>
            </span>
            <span className="text-[14px] font-semibold acct-hero__value tnum shrink-0">
              {hideBalance
                ? "•••"
                : fmtMoney(otherBalance)}
            </span>
          </button>
        </div>
      </section>

      {/* Crypto bar — tap through to the desk */}
      <CryptoBar hideBalance={hideBalance} />

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3">
        <KPI
          label="Spent · 30d"
          value={fmtMoney(spent30)}
          deltaLabel={spentPrev > 0 ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs. prev` : "—"}
          deltaUp={delta > 0}
          tone="ink"
        />
        <KPI
          label="Received · 30d"
          value={fmtMoney(recv30)}
          deltaLabel={`${last30.filter((t) => t.direction === "credit").length} incoming`}
          deltaUp={false}
          tone="brand"
        />
      </section>

      {/* Chart + categories — stack on mobile, side-by-side on desktop */}
      <section className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                Spending · last 30 days
              </div>
              <div className="mt-1 text-[24px] sm:text-[28px] font-bold text-ink-900 tracking-tight tabular-nums">
                {fmtMoney(spent30)}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: delta > 0 ? "#dc2626" : "#0a8a6f" }}>
                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {spentPrev > 0 ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` : "—"}
              </div>
              <div className="text-[11.5px] text-ink-400">vs. previous 30d</div>
            </div>
          </div>
          <div className="mt-4">
            <SpendingChart txns={accountTxns} days={30} account={account} />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              Top categories
            </div>
            <Sparkles className="h-4 w-4 text-ink-300" />
          </div>
          <div className="mt-4">
            <CategoryBreakdown txns={last30} account={account} />
          </div>
        </div>
      </section>

      {/* Pending transfers */}
      {pendingTransfers.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[17px] font-semibold text-ink-900">Pending transfers</h2>
            <Link href="/dashboard/transactions" className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900 transition">
              See all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-ink-100">
            {pendingTransfers.map((t) => (
              <li key={t.id} className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-500/15 text-amber-300 grid place-items-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                    {t.beneficiary_name || "—"}
                  </div>
                  <div className="text-[11.5px] text-ink-400">
                    {t.reference_id} · {railLabel(t.rail)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-bold text-ink-900 tabular-nums">
                    {fmtMoney(num(t.amount), t.currency || "EUR")}
                  </div>
                  <div className="text-[10.5px] text-amber-300 font-semibold uppercase tracking-wide">
                    Pending
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent activity */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] sm:text-[17px] font-semibold text-ink-900">Recent activity</h2>
          <Link href="/dashboard/transactions" className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500 hover:text-ink-900 transition">
            See all
          </Link>
        </div>
        {loading && recentTxns.length === 0 ? (
          <div className="py-6 text-center text-[13.5px] text-ink-400">Loading…</div>
        ) : recentTxns.length === 0 ? (
          <div className="py-6 text-center text-[13.5px] text-ink-500">
            No activity on this account yet.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {recentTxns.map((t) => (
              <li key={t.id} className="py-3 flex items-center gap-3">
                <div
                  className={cx(
                    "h-10 w-10 rounded-full grid place-items-center shrink-0",
                    t.direction === "credit" ? "bg-[rgba(61,155,110,0.12)] text-up" : "bg-ink-100 text-ink-600"
                  )}
                >
                  {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] sm:text-[14.5px] font-semibold text-ink-900 truncate">
                    {t.counterparty_name || t.merchant || "Transaction"}
                  </div>
                  <div className="text-[11.5px] text-ink-400 truncate">
                    {t.created_at ? fmtRelativeDate(t.created_at) : "—"} · {t.category || "—"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={cx(
                      "text-[14px] sm:text-[15px] font-bold tabular-nums",
                      t.direction === "credit" ? "text-up" : "text-ink-900"
                    )}
                  >
                    {t.direction === "credit" ? "+ " : "− "}
                    {fmtMoney(num(t.amount), t.currency || "EUR")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({
  label, value, deltaLabel, deltaUp, tone,
}: {
  label: string; value: string; deltaLabel: string; deltaUp: boolean; tone: "ink" | "brand";
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</div>
      <div className={cx(
        "mt-1 text-[22px] sm:text-[28px] font-bold tracking-tight tabular-nums",
        tone === "brand" ? "text-ink-900" : "text-ink-900"
      )}>
        {value}
      </div>
      <div className="mt-1 text-[11.5px] text-ink-400 inline-flex items-center gap-1">
        {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {deltaLabel}
      </div>
    </div>
  );
}

function ActionTile({ Icon, label, href }: { Icon: any; label: string; href: string }) {
  return (
    // Segments of one toolbar: the 1px grid gap supplies the dividers, so the
    // tiles read as a single control instead of four floating chips.
    <Link
      href={href}
      className="acct-hero__tool flex flex-col items-center justify-center gap-1.5 py-3.5 transition focus-ring"
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-[11px] font-medium tracking-[0.02em]">{label}</span>
    </Link>
  );
}

// Null-safe rail label — see receipt page and transactions page for the
// same defensive pattern. The original `r.toUpperCase()` blew up the entire
// dashboard whenever a pending transfer happened to have a null/empty rail.
function railLabel(r: string | null | undefined) {
  if (!r) return "Transfer";
  if (r === "sepa_instant") return "SEPA Instant";
  if (r === "sepa") return "SEPA Transfer";
  if (r === "internal") return "Internal Transfer";
  if (r === "swift") return "International (SWIFT)";
  if (r === "topup") return "Top-up";
  if (r === "fee") return "Fee";
  return String(r).toUpperCase();
}
