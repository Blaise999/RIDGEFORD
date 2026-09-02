"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PriceChart, type Point } from "@/components/crypto/Charts";
import { CoinBadge } from "@/components/dashboard/CryptoBar";
import { DESK, fmtCoin, fmtCompact, fmtPrice } from "@/lib/crypto";
import { fmtMoney, cx } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Send,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const RANGES = [
  { v: "1", l: "24H" },
  { v: "7", l: "7D" },
  { v: "30", l: "30D" },
  { v: "90", l: "90D" },
  { v: "365", l: "1Y" },
];

type Mode = "buy" | "sell" | "send";
type Destination = "hold" | "withdraw";

export default function CoinDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const router = useRouter();

  const [market, setMarket] = useState<any>(null);
  const [asset, setAsset] = useState<any>(null);
  const [series, setSeries] = useState<Point[]>([]);
  const [range, setRange] = useState("7");
  const [scrub, setScrub] = useState<Point | null>(null);
  const [position, setPosition] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── trade ticket ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("buy");
  const [destination, setDestination] = useState<Destination>("hold");
  const [eur, setEur] = useState("");
  const [coinQty, setCoinQty] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [stage, setStage] = useState<"form" | "review" | "otp" | "done">("form");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    const [c, p, me] = await Promise.all([
      fetch(`/api/crypto/chart?id=${id}&days=${range}`, { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
      fetch("/api/crypto/portfolio", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
      fetch("/api/auth/me", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
    ]);
    if (c?.ok) {
      setSeries(c.series || []);
      if (c.market) setMarket(c.market);
    }
    if (p?.ok) setPosition((p.positions || []).find((x: any) => x.asset_id === id) || null);
    if (me?.ok && me.user) setBalance(Number(me.user.balance_checking) || 0);
    setLoading(false);
  }, [id, range]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // asset metadata (network, fee, memo requirement) comes from the markets feed
  useEffect(() => {
    fetch("/api/crypto/markets", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          const m = (j.markets || []).find((x: any) => x.id === id);
          if (m) {
            setMarket((prev: any) => prev || m);
            setAsset(m);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  // ── live quote ──────────────────────────────────────────────────────────
  const debounce = useRef<any>(null);
  useEffect(() => {
    if (stage !== "form") return;
    const amount = mode === "buy" ? Number(eur.replace(",", ".")) : Number(coinQty.replace(",", "."));
    if (!amount || amount <= 0 || mode === "send") {
      setQuote(null);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setQuoting(true);
      try {
        const r = await fetch("/api/crypto/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            asset_id: id,
            side: mode,
            eur: mode === "buy" ? amount : undefined,
            quantity: mode === "sell" ? amount : undefined,
          }),
        });
        const j = await r.json();
        setQuote(j?.ok ? j.quote : null);
        setErr(j?.ok ? null : j?.error || null);
      } finally {
        setQuoting(false);
      }
    }, 320);
    return () => clearTimeout(debounce.current);
  }, [eur, coinQty, mode, id, stage]);

  const price = scrub?.p ?? market?.price_eur ?? 0;
  const rising = (market?.change_24h || 0) >= 0;
  const held = Number(position?.quantity) || 0;

  const sendQty = useMemo(() => {
    const v = Number(coinQty.replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  }, [coinQty]);

  const networkFee = Number(asset?.network_fee ?? 0);

  function resetTicket() {
    setStage("form");
    setEur("");
    setCoinQty("");
    setAddress("");
    setMemo("");
    setNote("");
    setOtp("");
    setOtpSent(null);
    setQuote(null);
    setResult(null);
    setErr(null);
  }

  async function requestOtp() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/crypto/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount: quote ? fmtMoney(quote.eur_amount) : undefined,
          address: address || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Could not send the code");
      setOtpSent(j.to || "your email");
      setStage("otp");
    } catch (e: any) {
      setErr(e?.message || "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  /*
    This threshold MUST match the server's. It was hardcoded to 1000 here while
    the route read DESK.OTP_THRESHOLD_EUR — if either ever moved, the client
    would submit without a code and the API would answer 401. A missing quote
    now also counts as "needs a code", so the safe path is the default rather
    than the exception.
  */
  const needsOtp =
    mode === "send" ||
    destination === "withdraw" ||
    (quote?.eur_amount ?? Number.POSITIVE_INFINITY) >= DESK.OTP_THRESHOLD_EUR;

  async function goReview() {
    setErr(null);
    if (mode === "send") {
      if (!held) return setErr(`You don't hold any ${market?.symbol}.`);
      if (!sendQty || sendQty <= 0) return setErr("Enter an amount to send.");
      if (sendQty > held) return setErr(`You only hold ${fmtCoin(held, market?.symbol)}.`);
      if (!address.trim()) return setErr("Enter the destination address.");
    } else {
      if (!quote) return setErr("Enter an amount.");
      if (mode === "buy" && quote.eur_amount > balance) {
        return setErr("That's more than your available balance.");
      }
      if (mode === "buy" && destination === "withdraw" && !address.trim()) {
        return setErr("Enter the destination address.");
      }
    }
    setStage("review");
  }

  async function confirm() {
    setBusy(true);
    setErr(null);
    try {
      const endpoint = mode === "send" ? "/api/crypto/send" : "/api/crypto/order";
      const body =
        mode === "send"
          ? { asset_id: id, quantity: sendQty, address: address.trim(), memo, note, otp }
          : {
              asset_id: id,
              side: mode,
              eur: mode === "buy" ? Number(eur.replace(",", ".")) : undefined,
              quantity: mode === "sell" ? Number(coinQty.replace(",", ".")) : undefined,
              destination: mode === "buy" ? destination : "hold",
              address: destination === "withdraw" ? address.trim() : undefined,
              memo: destination === "withdraw" ? memo : undefined,
              note,
              otp,
              quoted_unit_price: quote?.unit_price_eur,
            };

      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const j = await r.json();

      if (!r.ok || !j.ok) {
        if (j?.otp_required || r.status === 401) {
          // The server asked for a step-up. Send a code and show the screen —
          // never leave the customer staring at a dead Confirm button.
          setErr(j.error || "This order needs an authorisation code.");
          if (stage !== "otp") await requestOtp();
          return;
        }
        if (j?.quote) setQuote(j.quote);
        throw new Error(j?.error || "The order could not be completed");
      }

      setResult(j);
      setStage("done");
      load();
    } catch (e: any) {
      setErr(e?.message || "The order could not be completed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !market) {
    return (
      <div className="pt-10 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="pt-4 sm:pt-6 pb-10">
      <Link
        href="/dashboard/crypto"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Crypto desk
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] items-start">
        {/* ── chart column ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <CoinBadge symbol={market?.symbol || ""} image={market?.image} size={44} />
                <div className="min-w-0">
                  <h1 className="font-display text-[24px] sm:text-[30px] tracking-tight text-ink-900 leading-none truncate">
                    {market?.name}
                  </h1>
                  <div className="mt-1.5 text-[11.5px] uppercase tracking-[0.14em] text-ink-500 truncate">
                    {market?.symbol} · {asset?.network || market?.network}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="stat-figure text-[28px] sm:text-[36px] leading-none">
                  {fmtPrice(price)}
                </div>
                <div className={cx("mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold tnum", rising ? "up" : "down")}>
                  {rising ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {rising ? "+" : "−"}
                  {Math.abs(market?.change_24h || 0).toFixed(2)} % · 24h
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.v}
                  onClick={() => setRange(r.v)}
                  className={cx(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition",
                    range === r.v ? "bg-gold-500 text-ink-50" : "text-ink-500 hover:bg-panel-2 hover:text-ink-800"
                  )}
                >
                  {r.l}
                </button>
              ))}
              {scrub && (
                <span className="ml-auto text-[11.5px] text-ink-400 tnum">
                  {new Date(scrub.t).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <div className="mt-3">
              <PriceChart series={series} onScrub={setScrub} height={280} />
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Market cap" value={fmtCompact(market?.market_cap || 0)} />
            <Stat label="Volume · 24h" value={fmtCompact(market?.volume_24h || 0)} />
            <Stat label="High · 24h" value={fmtPrice(market?.high_24h || 0)} />
            <Stat label="Low · 24h" value={fmtPrice(market?.low_24h || 0)} />
          </section>

          {held > 0 && (
            <section className="card p-5 sm:p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">
                Your position
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11.5px] text-ink-400">Holding</div>
                  <div className="text-[17px] font-bold text-ink-900 tnum">
                    {fmtCoin(held, market?.symbol)}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-ink-400">Value</div>
                  <div className="text-[17px] font-bold text-ink-900 tnum">
                    {fmtMoney(position?.value_eur || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-ink-400">Profit / loss</div>
                  <div className={cx("text-[17px] font-bold tnum", (position?.pnl_eur || 0) >= 0 ? "up" : "down")}>
                    {(position?.pnl_eur || 0) >= 0 ? "+" : "−"}
                    {fmtMoney(Math.abs(position?.pnl_eur || 0))}
                    <span className="ml-1.5 text-[12.5px] font-semibold">
                      ({Math.abs(position?.pnl_pct || 0).toFixed(1)} %)
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── ticket column ─────────────────────────────────────────── */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <section className="card card-gold p-5">
            {stage === "done" ? (
              <Done
                result={result}
                symbol={market?.symbol}
                onAgain={resetTicket}
                onDesk={() => router.push("/dashboard/crypto")}
              />
            ) : (
              <>
                <div className="inline-flex w-full rounded-xl border border-ink-200 p-1 gap-1">
                  {(["buy", "sell", "send"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setStage("form");
                        setErr(null);
                        setQuote(null);
                      }}
                      className={cx(
                        "flex-1 px-3 py-2 rounded-lg text-[12.5px] font-semibold capitalize transition",
                        mode === m ? "bg-gold-500 text-ink-50" : "text-ink-600 hover:bg-panel-2"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {err && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-300">
                    {err}
                  </div>
                )}

                {stage === "form" && (
                  <div className="mt-4 space-y-4">
                    {mode === "buy" && (
                      <>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="label mb-0">You pay</label>
                            <span className="text-[11.5px] text-ink-400 tnum">
                              {fmtMoney(balance)} available
                            </span>
                          </div>
                          <div className="mt-1.5 relative">
                            <input
                              inputMode="decimal"
                              className="field h-14 pr-12 text-[22px] font-bold tnum"
                              placeholder="0,00"
                              value={eur}
                              onChange={(e) => setEur(e.target.value.replace(/[^0-9.,]/g, ""))}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-ink-500">
                              €
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            {[50, 100, 250, 500].map((v) => (
                              <button
                                key={v}
                                onClick={() => setEur(String(v))}
                                className="flex-1 rounded-lg border border-ink-200 py-1.5 text-[11.5px] font-semibold text-ink-600 hover:border-gold-500/40 hover:text-gold-200 transition"
                              >
                                {v} €
                              </button>
                            ))}
                            <button
                              onClick={() => setEur(String(Math.floor(balance)))}
                              className="flex-1 rounded-lg border border-ink-200 py-1.5 text-[11.5px] font-semibold text-ink-600 hover:border-gold-500/40 hover:text-gold-200 transition"
                            >
                              Max
                            </button>
                          </div>
                          <p className="hint">Debited from your main account balance.</p>
                        </div>

                        <Conversion quoting={quoting} quote={quote} symbol={market?.symbol} mode="buy" />

                        <div>
                          <label className="label">Then</label>
                          <div className="space-y-2">
                            <DestOption
                              active={destination === "hold"}
                              onClick={() => setDestination("hold")}
                              Icon={Wallet}
                              title="Add to my crypto bar"
                              sub="Held with Ridgeford, ready to sell or send later"
                            />
                            <DestOption
                              active={destination === "withdraw"}
                              onClick={() => setDestination("withdraw")}
                              Icon={Send}
                              title="Send to an address"
                              sub={`Straight out over ${asset?.network || "the network"}`}
                            />
                          </div>
                        </div>

                        {destination === "withdraw" && (
                          <AddressFields
                            asset={asset}
                            address={address}
                            setAddress={setAddress}
                            memo={memo}
                            setMemo={setMemo}
                            note={note}
                            setNote={setNote}
                          />
                        )}
                      </>
                    )}

                    {mode === "sell" && (
                      <>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="label mb-0">You sell</label>
                            <span className="text-[11.5px] text-ink-400 tnum">
                              {fmtCoin(held, market?.symbol)} held
                            </span>
                          </div>
                          <div className="mt-1.5 relative">
                            <input
                              inputMode="decimal"
                              className="field h-14 pr-20 text-[20px] font-bold tnum"
                              placeholder="0,00"
                              value={coinQty}
                              onChange={(e) => setCoinQty(e.target.value.replace(/[^0-9.,]/g, ""))}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-500">
                              {market?.symbol}
                            </span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            {[0.25, 0.5, 0.75, 1].map((f) => (
                              <button
                                key={f}
                                onClick={() => setCoinQty(String(held * f))}
                                className="flex-1 rounded-lg border border-ink-200 py-1.5 text-[11.5px] font-semibold text-ink-600 hover:border-gold-500/40 hover:text-gold-200 transition"
                              >
                                {f === 1 ? "Max" : `${f * 100} %`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Conversion quoting={quoting} quote={quote} symbol={market?.symbol} mode="sell" />
                        <p className="hint">Proceeds settle to your main account balance immediately.</p>
                      </>
                    )}

                    {mode === "send" && (
                      <>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="label mb-0">Amount</label>
                            <span className="text-[11.5px] text-ink-400 tnum">
                              {fmtCoin(held, market?.symbol)} held
                            </span>
                          </div>
                          <div className="mt-1.5 relative">
                            <input
                              inputMode="decimal"
                              className="field h-14 pr-20 text-[20px] font-bold tnum"
                              placeholder="0,00"
                              value={coinQty}
                              onChange={(e) => setCoinQty(e.target.value.replace(/[^0-9.,]/g, ""))}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-500">
                              {market?.symbol}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-ink-400">
                            <span className="tnum">≈ {fmtMoney(sendQty * (market?.price_eur || 0))}</span>
                            <button
                              onClick={() => setCoinQty(String(held))}
                              className="font-semibold text-gold-300 hover:text-gold-200"
                            >
                              Send everything
                            </button>
                          </div>
                        </div>

                        <AddressFields
                          asset={asset}
                          address={address}
                          setAddress={setAddress}
                          memo={memo}
                          setMemo={setMemo}
                          note={note}
                          setNote={setNote}
                        />

                        <div className="rounded-xl border border-ink-200 bg-panel-2/60 p-3 text-[11.5px] text-ink-500 space-y-1">
                          <Row l="Network fee" r={fmtCoin(networkFee, market?.symbol)} />
                          <Row
                            l="They receive"
                            r={fmtCoin(Math.max(0, sendQty - networkFee), market?.symbol)}
                            strong
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={goReview}
                      disabled={quoting}
                      className="btn btn-primary w-full h-12"
                    >
                      Review <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {stage === "review" && (
                  <Review
                    mode={mode}
                    destination={destination}
                    quote={quote}
                    market={market}
                    asset={asset}
                    sendQty={sendQty}
                    networkFee={networkFee}
                    address={address}
                    memo={memo}
                    busy={busy}
                    needsOtp={needsOtp}
                    onBack={() => setStage("form")}
                    onConfirm={() => (needsOtp ? requestOtp() : confirm())}
                  />
                )}

                {stage === "otp" && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-ink-200 bg-panel-2/60 p-4">
                      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-800">
                        <ShieldCheck className="h-4 w-4 text-gold-400" /> Authorise this order
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
                        We sent a six-digit code to {otpSent}. On-chain transfers can&apos;t be
                        reversed, so we confirm every one.
                      </p>
                    </div>

                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="field h-14 text-center text-[24px] font-bold tracking-[0.4em] tnum"
                    />

                    <button
                      onClick={confirm}
                      disabled={busy || otp.length !== 6}
                      className="btn btn-primary w-full h-12"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm order"}
                    </button>
                    <button
                      onClick={requestOtp}
                      disabled={busy}
                      className="w-full text-[12px] font-semibold text-ink-500 hover:text-ink-800"
                    >
                      Send a new code
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-400">
            Quotes include a 1,49 % spread and are indicative until the order fills.
            Digital assets aren&apos;t deposits and aren&apos;t covered by deposit protection.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">{label}</div>
      <div className="mt-1 text-[15px] font-bold text-ink-900 tnum truncate">{value}</div>
    </div>
  );
}

function Conversion({
  quoting,
  quote,
  symbol,
  mode,
}: {
  quoting: boolean;
  quote: any;
  symbol?: string;
  mode: "buy" | "sell";
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-panel-2/60 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-ink-500">{mode === "buy" ? "You get" : "You receive"}</span>
        {quoting && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
      </div>
      <div className="mt-1 text-[22px] font-bold text-ink-900 tnum">
        {quote
          ? mode === "buy"
            ? fmtCoin(quote.quantity, symbol)
            : fmtMoney(quote.eur_amount)
          : "—"}
      </div>
      {quote && (
        <div className="mt-2.5 pt-2.5 border-t border-ink-100 space-y-1">
          <Row l="Rate" r={`1 ${symbol} = ${fmtPrice(quote.unit_price_eur)}`} />
          <Row l="Spread" r={`${(quote.spread_bps / 100).toFixed(2)} %`} />
          <Row l="Fee" r={quote.fee_eur > 0 ? fmtMoney(quote.fee_eur) : "Waived"} />
        </div>
      )}
    </div>
  );
}

function Row({ l, r, strong }: { l: string; r: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-ink-500">{l}</span>
      <span className={cx("text-[11.5px] tnum truncate", strong ? "font-bold text-ink-900" : "text-ink-700")}>
        {r}
      </span>
    </div>
  );
}

function DestOption({
  active,
  onClick,
  Icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  Icon: any;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition",
        active ? "border-gold-500/60 bg-gold-500/[0.08]" : "border-ink-200 hover:border-ink-300"
      )}
    >
      <span
        className={cx(
          "h-9 w-9 rounded-lg grid place-items-center shrink-0",
          active ? "bg-gold-500/15 text-gold-300" : "bg-ink-100 text-ink-500"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ink-900">{title}</span>
        <span className="block text-[11.5px] text-ink-500 truncate">{sub}</span>
      </span>
      <span
        className={cx(
          "h-4 w-4 rounded-full border grid place-items-center shrink-0",
          active ? "border-gold-500 bg-gold-500" : "border-ink-300"
        )}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-ink-50" />}
      </span>
    </button>
  );
}

function AddressFields({
  asset,
  address,
  setAddress,
  memo,
  setMemo,
  note,
  setNote,
}: {
  asset: any;
  address: string;
  setAddress: (v: string) => void;
  memo: string;
  setMemo: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Destination address</label>
        <textarea
          rows={2}
          className="field font-mono text-[12.5px]"
          placeholder={asset?.network?.includes("Bitcoin") ? "bc1…" : "0x…"}
          value={address}
          onChange={(e) => setAddress(e.target.value.trim())}
        />
        <p className="hint">
          Network: <span className="text-ink-700 font-medium">{asset?.network || "—"}</span>. Sending
          to an address on a different network will lose the funds permanently.
        </p>
      </div>

      {asset?.needs_memo && (
        <div>
          <label className="label">Destination tag / memo</label>
          <input className="field" value={memo} onChange={(e) => setMemo(e.target.value)} />
          <p className="hint">Required by {asset?.network}. Ask the recipient for it.</p>
        </div>
      )}

      <div>
        <label className="label">Reference (optional)</label>
        <input
          className="field"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}

function Review({
  mode,
  destination,
  quote,
  market,
  asset,
  sendQty,
  networkFee,
  address,
  memo,
  busy,
  needsOtp,
  onBack,
  onConfirm,
}: any) {
  const isSend = mode === "send";
  const outbound = isSend || destination === "withdraw";

  return (
    <div className="mt-4 space-y-4">
      <div className="text-[13px] font-semibold text-ink-900">Check the details</div>

      <div className="rounded-xl border border-ink-200 divide-y divide-ink-100 overflow-hidden">
        {mode === "buy" && (
          <>
            <ReviewRow l="You pay" r={fmtMoney(quote?.eur_amount || 0)} />
            <ReviewRow l="You get" r={fmtCoin(quote?.quantity || 0, market?.symbol)} strong />
            <ReviewRow l="Rate" r={`1 ${market?.symbol} = ${fmtPrice(quote?.unit_price_eur || 0)}`} />
            <ReviewRow l="Fee" r={quote?.fee_eur > 0 ? fmtMoney(quote.fee_eur) : "Waived"} />
            <ReviewRow l="Source" r="Main account balance" />
          </>
        )}
        {mode === "sell" && (
          <>
            <ReviewRow l="You sell" r={fmtCoin(quote?.quantity || 0, market?.symbol)} />
            <ReviewRow l="You receive" r={fmtMoney(quote?.eur_amount || 0)} strong />
            <ReviewRow l="Rate" r={`1 ${market?.symbol} = ${fmtPrice(quote?.unit_price_eur || 0)}`} />
            <ReviewRow l="Settles to" r="Main account balance" />
          </>
        )}
        {isSend && (
          <>
            <ReviewRow l="You send" r={fmtCoin(sendQty, market?.symbol)} />
            <ReviewRow l="Network fee" r={fmtCoin(networkFee, market?.symbol)} />
            <ReviewRow l="They receive" r={fmtCoin(Math.max(0, sendQty - networkFee), market?.symbol)} strong />
          </>
        )}
        {outbound && (
          <>
            <ReviewRow l="Network" r={asset?.network || "—"} />
            <ReviewRow l="To" r={address} mono />
            {memo && <ReviewRow l="Memo" r={memo} mono />}
          </>
        )}
      </div>

      {outbound && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3.5">
          <div className="flex items-center gap-2 text-[12px] font-bold text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Check the address character by character
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-600">
            Blockchain transfers are irreversible. Ridgeford cannot recover funds sent to
            a wrong or incompatible address. Withdrawals are released after a compliance
            check, usually within a few hours.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="btn btn-ghost h-12 flex-1">
          Back
        </button>
        <button onClick={onConfirm} disabled={busy} className="btn btn-primary h-12 flex-[1.6]">
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : needsOtp ? (
            <>
              Authorise <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ l, r, strong, mono }: { l: string; r: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <span className="text-[12px] text-ink-500 shrink-0">{l}</span>
      <span
        className={cx(
          "text-[12.5px] text-right break-all",
          mono && "font-mono text-[11.5px]",
          strong ? "font-bold text-ink-900" : "text-ink-700"
        )}
      >
        {r}
      </span>
    </div>
  );
}

function Done({
  result,
  symbol,
  onAgain,
  onDesk,
}: {
  result: any;
  symbol?: string;
  onAgain: () => void;
  onDesk: () => void;
}) {
  const w = result?.withdrawal;
  const o = result?.order;
  const [copied, setCopied] = useState(false);
  const ref = w?.reference_id || o?.reference_id || "";

  return (
    <div className="py-4 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-up/15 text-up grid place-items-center">
        <Check className="h-7 w-7" strokeWidth={3} />
      </div>

      <h3 className="mt-4 font-display text-[22px] text-ink-900">
        {w ? "Withdrawal submitted" : o?.side === "sell" ? "Sold" : "Order filled"}
      </h3>

      <p className="mt-2 text-[13px] leading-relaxed text-ink-500 px-2">
        {w ? (
          <>
            {fmtCoin(Number(w.quantity), symbol)} is queued for {w.network}. We&apos;ll notify you the
            moment it&apos;s broadcast.
          </>
        ) : o?.side === "sell" ? (
          <>
            {fmtMoney(Number(o.eur_amount))} has settled to your main account balance.
          </>
        ) : (
          <>
            {fmtCoin(Number(o?.quantity || 0), symbol)} is now in your crypto bar.
          </>
        )}
      </p>

      {ref && (
        <button
          onClick={() => {
            navigator.clipboard?.writeText(ref);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-[12px] font-mono text-ink-600 hover:border-gold-500/40 transition"
        >
          {ref}
          {copied ? <Check className="h-3.5 w-3.5 text-up" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className="mt-6 flex gap-2">
        <button onClick={onDesk} className="btn btn-ghost h-11 flex-1">
          Back to desk
        </button>
        <button onClick={onAgain} className="btn btn-primary h-11 flex-1">
          New order
        </button>
      </div>
    </div>
  );
}
