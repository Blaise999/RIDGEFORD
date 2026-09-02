"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkline } from "@/components/crypto/Charts";
import { CoinBadge } from "@/components/dashboard/CryptoBar";
import { fmtCoin, fmtCompact, fmtPrice } from "@/lib/crypto";
import { fmtMoney, cx } from "@/lib/utils";
import {
  ArrowUpRight,
  Clock,
  Info,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type Market = {
  id: string;
  symbol: string;
  name: string;
  network: string;
  color: string;
  price_eur: number;
  change_24h: number;
  change_7d: number;
  market_cap: number;
  volume_24h: number;
  sparkline: number[];
  image?: string;
  stale: boolean;
};

type Sort = "market_cap" | "change_24h" | "price_eur" | "volume_24h";

export default function CryptoDeskPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("market_cap");
  const [tab, setTab] = useState<"all" | "held">("all");
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let on = true;
    async function load() {
      try {
        const [m, p] = await Promise.all([
          fetch("/api/crypto/markets", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
          fetch("/api/crypto/portfolio", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
        ]);
        if (!on) return;
        if (m?.ok) {
          setMarkets(m.markets || []);
          setStale(Boolean(m.stale));
        }
        if (p?.ok) {
          setPositions(p.positions || []);
          setTotals(p.totals || null);
          setPending(p.pending_withdrawals || []);
        }
      } finally {
        if (on) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  const heldIds = useMemo(
    () => new Set(positions.filter((p) => p.quantity > 0).map((p) => p.asset_id)),
    [positions]
  );

  const rows = useMemo(() => {
    let list = [...markets];
    if (tab === "held") list = list.filter((m) => heldIds.has(m.id));
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (m) => m.name.toLowerCase().includes(needle) || m.symbol.toLowerCase().includes(needle)
      );
    }
    list.sort((a, b) => (Number(b[sort]) || 0) - (Number(a[sort]) || 0));
    return list;
  }, [markets, q, sort, tab, heldIds]);

  const gainers = useMemo(
    () => [...markets].sort((a, b) => b.change_24h - a.change_24h).slice(0, 3),
    [markets]
  );
  const losers = useMemo(
    () => [...markets].sort((a, b) => a.change_24h - b.change_24h).slice(0, 3),
    [markets]
  );

  return (
    <div className="pt-4 sm:pt-6 pb-10 space-y-5">
      {/* header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[26px] sm:text-[32px] tracking-tight text-ink-900">
            Crypto desk
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Buy with your euro balance. Hold here, or send to any external wallet.
          </p>
        </div>
        {stale && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11.5px] text-amber-300">
            <Info className="h-3.5 w-3.5" /> Showing last known prices
          </span>
        )}
      </div>

      {/* portfolio summary */}
      {positions.some((p) => p.quantity > 0) && (
        <section className="card card-gold p-5 sm:p-6">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Portfolio value
              </div>
              <div className="mt-1.5 text-[32px] sm:text-[38px] font-bold tracking-tight text-ink-900 tnum leading-none">
                {fmtMoney(totals?.value_eur || 0)}
              </div>
              <div className="mt-2 flex items-center gap-4 text-[12.5px]">
                <Delta label="24h" value={totals?.change_24h_pct || 0} amount={totals?.change_24h_eur || 0} />
                <Delta label="All-time" value={totals?.pnl_pct || 0} amount={totals?.pnl_eur || 0} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">Invested</div>
              <div className="text-[16px] font-semibold text-ink-700 tnum">
                {fmtMoney(totals?.invested_eur || 0)}
              </div>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-amber-300">
                <Clock className="h-4 w-4" /> Pending withdrawals
              </div>
              <ul className="mt-2 space-y-1.5">
                {pending.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 text-[12px] text-ink-600">
                    <span className="truncate">
                      {w.reference_id} · {w.network} · {shorten(w.address)}
                    </span>
                    <span className="tnum shrink-0">{fmtMoney(Number(w.eur_value) || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* movers */}
      {!loading && markets.length > 0 && (
        <section className="grid sm:grid-cols-2 gap-4">
          <MoverCard title="Top gainers · 24h" rows={gainers} up />
          <MoverCard title="Top losers · 24h" rows={losers} />
        </section>
      )}

      {/* controls */}
      <section className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Bitcoin, ETH, Solana…"
            className="field pl-10"
          />
        </div>

        <div className="inline-flex rounded-xl border border-ink-200 p-1 gap-1">
          {[
            { v: "all", l: "All coins" },
            { v: "held", l: "My assets" },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v as any)}
              className={cx(
                "px-4 py-2 rounded-lg text-[12.5px] font-semibold transition",
                tab === t.v ? "bg-gold-500 text-ink-50" : "text-ink-600 hover:bg-panel-2"
              )}
            >
              {t.l}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="field w-auto min-w-[150px]"
        >
          <option value="market_cap">Market cap</option>
          <option value="change_24h">24h change</option>
          <option value="price_eur">Price</option>
          <option value="volume_24h">Volume</option>
        </select>
      </section>

      {/* market table */}
      <section className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_120px_100px] gap-4 px-5 py-3 border-b border-ink-100 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500">
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">7d</span>
          <span className="text-right">Market cap</span>
          <span className="text-right">7d trend</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[14px] text-ink-500">
              {tab === "held" ? "You don't hold any digital assets yet." : "No coins match that search."}
            </p>
            {tab === "held" && (
              <button onClick={() => setTab("all")} className="btn btn-primary h-10 mt-4 text-[13.5px]">
                Browse the market
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map((m) => {
              const pos = positions.find((p) => p.asset_id === m.id && p.quantity > 0);
              const rising = m.change_24h >= 0;
              return (
                <li key={m.id}>
                  <Link
                    href={`/dashboard/crypto/${m.id}`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_120px_100px] gap-4 items-center px-5 py-3.5 hover:bg-panel-2/50 transition"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <CoinBadge symbol={m.symbol} image={m.image} size={34} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-ink-900 truncate">{m.name}</span>
                          {pos && (
                            <span className="rounded-full bg-gold-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-300 shrink-0">
                              Held
                            </span>
                          )}
                        </span>
                        <span className="block text-[11.5px] text-ink-400 truncate">
                          {pos ? fmtCoin(pos.quantity, m.symbol) : m.symbol}
                        </span>
                      </span>
                    </span>

                    {/* mobile-compact price cluster */}
                    <span className="md:hidden text-right">
                      <span className="block text-[14px] font-semibold text-ink-900 tnum">
                        {fmtPrice(m.price_eur)}
                      </span>
                      <span className={cx("block text-[12px] font-semibold tnum", rising ? "up" : "down")}>
                        {rising ? "+" : "−"}
                        {Math.abs(m.change_24h).toFixed(2)} %
                      </span>
                    </span>

                    <span className="hidden md:block text-right text-[14px] font-semibold text-ink-900 tnum">
                      {fmtPrice(m.price_eur)}
                    </span>
                    <span className={cx("hidden md:block text-right text-[13px] font-semibold tnum", rising ? "up" : "down")}>
                      {rising ? "+" : "−"}
                      {Math.abs(m.change_24h).toFixed(2)} %
                    </span>
                    <span className={cx("hidden md:block text-right text-[13px] font-semibold tnum", m.change_7d >= 0 ? "up" : "down")}>
                      {m.change_7d >= 0 ? "+" : "−"}
                      {Math.abs(m.change_7d || 0).toFixed(2)} %
                    </span>
                    <span className="hidden md:block text-right text-[12.5px] text-ink-500 tnum">
                      {fmtCompact(m.market_cap)}
                    </span>
                    <span className="hidden md:flex justify-end">
                      <Sparkline data={m.sparkline} up={rising} width={90} height={30} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[11.5px] leading-relaxed text-ink-400 max-w-3xl">
        Digital assets are not deposits and are not covered by the German deposit
        guarantee scheme. Their value can fall as well as rise, and you may get back
        less than you put in. Prices shown include the Ridgeford spread of 1,49 %.
        On-chain transfers cannot be reversed once broadcast.
      </p>
    </div>
  );
}

function Delta({ label, value, amount }: { label: string; value: number; amount: number }) {
  const up = value >= 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("inline-flex items-center gap-1 font-semibold tnum", up ? "up" : "down")}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {up ? "+" : "−"}
        {fmtMoney(Math.abs(amount))} ({Math.abs(value).toFixed(2)} %)
      </span>
      <span className="text-ink-400">{label}</span>
    </span>
  );
}

function MoverCard({ title, rows, up }: { title: string; rows: Market[]; up?: boolean }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">{title}</div>
      <ul className="mt-3 space-y-2">
        {rows.map((m) => (
          <li key={m.id}>
            <Link
              href={`/dashboard/crypto/${m.id}`}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-panel-2/60 transition group"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <CoinBadge symbol={m.symbol} image={m.image} size={26} />
                <span className="text-[13px] font-medium text-ink-800 truncate">{m.name}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[12.5px] text-ink-500 tnum">{fmtPrice(m.price_eur)}</span>
                <span className={cx("text-[12.5px] font-semibold tnum w-16 text-right", up ? "up" : "down")}>
                  {m.change_24h >= 0 ? "+" : "−"}
                  {Math.abs(m.change_24h).toFixed(2)} %
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 opacity-0 group-hover:opacity-100 transition" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shorten(a: string) {
  return a && a.length > 18 ? `${a.slice(0, 9)}…${a.slice(-6)}` : a;
}
