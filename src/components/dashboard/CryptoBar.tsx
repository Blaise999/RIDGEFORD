"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkline } from "@/components/crypto/Charts";
import { fmtCoin, fmtPrice } from "@/lib/crypto";
import { fmtMoney, cx } from "@/lib/utils";
import { ArrowUpRight, Bitcoin, ChevronRight, Clock, Plus, TrendingDown, TrendingUp } from "lucide-react";

type Position = {
  asset_id: string;
  symbol: string;
  name: string;
  color: string;
  quantity: number;
  price_eur: number;
  change_24h: number;
  sparkline: number[];
  image?: string;
  value_eur: number;
  pnl_eur: number;
  pnl_pct: number;
};

type Totals = {
  value_eur: number;
  invested_eur: number;
  pnl_eur: number;
  pnl_pct: number;
  change_24h_eur: number;
  change_24h_pct: number;
};

/**
 * The crypto bar on the dashboard.
 *
 * Empty state doubles as the entry point to the desk: tap anywhere and you
 * land in the market list. Prices refresh every 60s, matching the server cache.
 */
/**
 * Coin logo, with the ticker as the fallback.
 *
 * The image comes from CoinGecko's own CDN in the keyless markets response —
 * no key, no separate asset pipeline, and it degrades to a lettered disc if
 * the feed is cold or the request fails.
 */
export function CoinBadge({
  symbol,
  image,
  size = 24,
}: {
  symbol: string;
  image?: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const px = { width: size, height: size };

  if (image && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        style={px}
        className="shrink-0 rounded-full bg-panel-2 ring-1 ring-ink-200 object-cover"
      />
    );
  }

  return (
    <span
      style={{ ...px, fontSize: size * 0.36 }}
      className="shrink-0 grid place-items-center rounded-full bg-panel-2 ring-1 ring-ink-200 font-semibold text-ink-600"
    >
      {String(symbol || "").slice(0, 3)}
    </span>
  );
}

export function CryptoBar({ hideBalance = false }: { hideBalance?: boolean }) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [movers, setMovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;

    async function load() {
      try {
        const [p, m] = await Promise.all([
          fetch("/api/crypto/portfolio", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
          fetch("/api/crypto/markets", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
        ]);
        if (!on) return;
        if (p?.ok) {
          setPositions(p.positions || []);
          setTotals(p.totals || null);
          setPending(p.pending_withdrawals || []);
        }
        if (m?.ok) setMovers((m.markets || []).slice(0, 6));
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

  const held = positions.filter((p) => p.quantity > 0);
  const up = (totals?.change_24h_pct || 0) >= 0;

  return (
    <section className="card card-gold overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-8 w-8 rounded-xl grid place-items-center bg-gold-500/12 text-gold-300 shrink-0">
            <Bitcoin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Crypto
            </div>
            <div className="text-[11.5px] text-ink-400 truncate">
              {held.length ? `${held.length} asset${held.length > 1 ? "s" : ""} held` : "Live market prices"}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/crypto"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-gold-300 hover:text-gold-200 shrink-0"
        >
          Open desk <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* value */}
      <div className="px-5 sm:px-6 pt-4">
        {loading ? (
          <div className="skeleton h-9 w-48" />
        ) : held.length ? (
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-ink-900 tnum leading-none">
                {hideBalance ? "••••••" : fmtMoney(totals?.value_eur || 0)}
              </div>
              {!hideBalance && (
                <div className="mt-2 flex items-center gap-3 text-[12.5px]">
                  <span className={cx("inline-flex items-center gap-1 font-semibold tnum", up ? "up" : "down")}>
                    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {up ? "+" : "−"}
                    {fmtMoney(Math.abs(totals?.change_24h_eur || 0))} ({Math.abs(totals?.change_24h_pct || 0).toFixed(2)} %)
                  </span>
                  <span className="text-ink-400">24h</span>
                </div>
              )}
            </div>

            {!hideBalance && totals && totals.invested_eur > 0 && (
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">All-time</div>
                <div className={cx("text-[15px] font-bold tnum", totals.pnl_eur >= 0 ? "up" : "down")}>
                  {totals.pnl_eur >= 0 ? "+" : "−"}
                  {fmtMoney(Math.abs(totals.pnl_eur))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13.5px] leading-relaxed text-ink-500 max-w-md">
              Convert euros from your account into Bitcoin, Ethereum and 28 more —
              hold them here, or send them straight to an external wallet.
            </p>
            <Link href="/dashboard/crypto" className="btn btn-primary h-10 text-[13.5px]">
              <Plus className="h-4 w-4" /> Buy crypto
            </Link>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-2.5 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span className="text-[12px] text-amber-300">
            {pending.length} withdrawal{pending.length > 1 ? "s" : ""} awaiting compliance review
          </span>
        </div>
      )}

      {/* the bar itself — horizontally scrollable coin tiles */}
      <div className="mt-4 pb-5">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex gap-3 px-5 sm:px-6 min-w-min">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-[92px] w-[172px] shrink-0 rounded-2xl" />
                ))
              : (held.length ? held : movers).map((c: any) => {
                  const isHeld = held.length > 0;
                  const rising = (c.change_24h || 0) >= 0;
                  return (
                    <Link
                      key={c.asset_id || c.id}
                      href={`/dashboard/crypto/${c.asset_id || c.id}`}
                      className="group shrink-0 w-[172px] rounded-2xl border border-ink-200 bg-panel-2/70 p-3.5 hover:border-gold-500/40 hover:bg-panel-3/70 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 min-w-0">
                          <CoinBadge symbol={c.symbol} image={c.image} size={22} />
                          <span className="text-[13px] font-semibold text-ink-900 truncate">{c.symbol}</span>
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>

                      <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-bold text-ink-900 tnum truncate">
                            {hideBalance && isHeld
                              ? "•••"
                              : isHeld
                              ? fmtMoney(c.value_eur)
                              : fmtPrice(c.price_eur)}
                          </div>
                          <div className={cx("text-[11.5px] font-semibold tnum", rising ? "up" : "down")}>
                            {rising ? "+" : "−"}
                            {Math.abs(c.change_24h || 0).toFixed(2)} %
                          </div>
                        </div>
                        <Sparkline data={c.sparkline || []} up={rising} width={54} height={24} />
                      </div>

                      {isHeld && !hideBalance && (
                        <div className="mt-2 pt-2 border-t border-ink-100 text-[11px] text-ink-400 tnum truncate">
                          {fmtCoin(c.quantity, c.symbol)}
                        </div>
                      )}
                    </Link>
                  );
                })}

            <Link
              href="/dashboard/crypto"
              className="shrink-0 w-[120px] rounded-2xl border border-dashed border-ink-200 grid place-items-center text-ink-500 hover:text-gold-300 hover:border-gold-500/40 transition"
            >
              <span className="flex flex-col items-center gap-1.5 py-6">
                <Plus className="h-4 w-4" />
                <span className="text-[11.5px] font-semibold">All coins</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
