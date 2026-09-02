import { supabaseAdmin } from "./supabase/admin";

/**
 * Ridgeford crypto desk — market data + pricing.
 *
 * Prices come from CoinGecko (no key required for the public endpoints).
 * Everything is wrapped in three layers of resilience because a bank UI
 * must never render "—" just because an upstream feed hiccuped:
 *
 *   1. in-process memory cache (fast path, ~60s)
 *   2. `crypto_price_cache` table (last known good, survives cold starts)
 *   3. deterministic synthetic series (dev / offline / rate-limited)
 *
 * NO API KEY IS REQUIRED. The public CoinGecko endpoints used here
 * (/coins/markets and /coins/{id}/market_chart) are keyless and rate-limited
 * per IP, which is why every response is cached for 60s in memory and mirrored
 * into crypto_price_cache. COINGECKO_API_KEY is optional and only switches to
 * the Pro host for higher limits — the desk works fully without it.
 */

export const DESK = {
  /** Ridgeford spread applied to the mid price, in basis points. */
  SPREAD_BPS: 149,
  /** Flat processing fee on each order, in EUR. */
  FLAT_FEE_EUR: 0.99,
  /** Fee is waived above this order size. */
  FLAT_FEE_WAIVER_EUR: 1000,
  MIN_ORDER_EUR: 10,
  MAX_ORDER_EUR: 50_000,
  /** Orders above this need the same OTP step-up a SEPA transfer gets. */
  OTP_THRESHOLD_EUR: 1_000,
};

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  network: string;
  address_regex: string | null;
  needs_memo: boolean;
  decimals: number;
  network_fee: number;
  color: string | null;
  sort_order: number;
  active: boolean;
};

export type Market = {
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
  high_24h: number;
  low_24h: number;
  sparkline: number[];
  /** CoinGecko-hosted coin logo. Keyless, CDN-served, no attribution needed. */
  image: string;
  stale: boolean;
};

const API = process.env.COINGECKO_API_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

function headers(): Record<string, string> {
  const h: Record<string, string> = { accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) {
    h["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;
  }
  return h;
}

// ── caches ──────────────────────────────────────────────────────────────────
const MARKET_TTL = 60_000;
const CHART_TTL = 5 * 60_000;
let marketCache: { at: number; data: Market[] } | null = null;
const chartCache = new Map<string, { at: number; data: ChartPoint[] }>();

export type ChartPoint = { t: number; p: number };

// ── asset catalogue ─────────────────────────────────────────────────────────
let assetCache: { at: number; data: Asset[] } | null = null;

export async function listAssets(): Promise<Asset[]> {
  if (assetCache && Date.now() - assetCache.at < 5 * 60_000) return assetCache.data;
  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("crypto_assets")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length) {
      const assets = data as Asset[];
      assetCache = { at: Date.now(), data: assets };
      return assets;
    }
  } catch (e) {
    console.warn("[crypto] asset catalogue unavailable:", (e as any)?.message);
  }
  return FALLBACK_ASSETS;
}

export async function getAsset(id: string): Promise<Asset | null> {
  const all = await listAssets();
  return all.find((a) => a.id === id) || null;
}

/** Minimal catalogue so the desk still renders before the migration is run. */
const FALLBACK_ASSETS: Asset[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", network: "Bitcoin", address_regex: "^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$", needs_memo: false, decimals: 8, network_fee: 0.00008, color: "#f7931a", sort_order: 1, active: true },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", network: "Ethereum (ERC-20)", address_regex: "^0x[a-fA-F0-9]{40}$", needs_memo: false, decimals: 8, network_fee: 0.0009, color: "#627eea", sort_order: 2, active: true },
  { id: "tether", symbol: "USDT", name: "Tether", network: "Ethereum (ERC-20)", address_regex: "^0x[a-fA-F0-9]{40}$", needs_memo: false, decimals: 6, network_fee: 6.5, color: "#26a17b", sort_order: 3, active: true },
  { id: "solana", symbol: "SOL", name: "Solana", network: "Solana", address_regex: "^[1-9A-HJ-NP-Za-km-z]{32,44}$", needs_memo: false, decimals: 8, network_fee: 0.001, color: "#14f195", sort_order: 4, active: true },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", network: "Ethereum (ERC-20)", address_regex: "^0x[a-fA-F0-9]{40}$", needs_memo: false, decimals: 6, network_fee: 6.5, color: "#2775ca", sort_order: 5, active: true },
];

// ── market data ─────────────────────────────────────────────────────────────
export async function getMarkets(force = false): Promise<Market[]> {
  if (!force && marketCache && Date.now() - marketCache.at < MARKET_TTL) {
    return marketCache.data;
  }

  const assets = await listAssets();
  const ids = assets.map((a) => a.id).join(",");

  try {
    const url =
      `${API}/coins/markets?vs_currency=eur&ids=${encodeURIComponent(ids)}` +
      `&order=market_cap_desc&per_page=250&page=1&sparkline=true` +
      `&price_change_percentage=24h,7d`;

    const res = await fetch(url, { headers: headers(), next: { revalidate: 60 } } as any);
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const rows: any[] = await res.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error("empty feed");

    const byId = new Map(rows.map((r) => [r.id, r]));
    const markets: Market[] = assets.map((a) => {
      const r = byId.get(a.id);
      if (!r) return synthetic(a, true);
      return {
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        network: a.network,
        color: a.color || "#c9a227",
        price_eur: Number(r.current_price) || 0,
        change_24h: Number(r.price_change_percentage_24h_in_currency ?? r.price_change_percentage_24h) || 0,
        change_7d: Number(r.price_change_percentage_7d_in_currency) || 0,
        market_cap: Number(r.market_cap) || 0,
        volume_24h: Number(r.total_volume) || 0,
        high_24h: Number(r.high_24h) || 0,
        low_24h: Number(r.low_24h) || 0,
        sparkline: (r.sparkline_in_7d?.price || []).filter((n: any) => Number.isFinite(n)).slice(-72),
        image: logoFor(a.symbol, r.image),
        stale: false,
      };
    });

    marketCache = { at: Date.now(), data: markets };
    void persistPrices(markets);
    return markets;
  } catch (e) {
    console.warn("[crypto] live feed unavailable:", (e as any)?.message);
    const cached = await readPersistedPrices(assets);
    if (cached) {
      marketCache = { at: Date.now() - MARKET_TTL / 2, data: cached };
      return cached;
    }
    const fake = assets.map((a) => synthetic(a, true));
    marketCache = { at: Date.now() - MARKET_TTL / 2, data: fake };
    return fake;
  }
}

export async function getMarket(id: string): Promise<Market | null> {
  const all = await getMarkets();
  return all.find((m) => m.id === id) || null;
}

/** Price series for the detail chart. `days` = 1 | 7 | 30 | 90 | 365 | 'max'. */
export async function getChart(id: string, days: string | number = 7): Promise<ChartPoint[]> {
  const key = `${id}:${days}`;
  const hit = chartCache.get(key);
  if (hit && Date.now() - hit.at < CHART_TTL) return hit.data;

  try {
    const url = `${API}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=eur&days=${days}`;
    const res = await fetch(url, { headers: headers(), next: { revalidate: 300 } } as any);
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const body = await res.json();
    const points: ChartPoint[] = (body?.prices || [])
      .filter((p: any) => Array.isArray(p) && Number.isFinite(p[1]))
      .map((p: any) => ({ t: p[0], p: p[1] }));
    if (!points.length) throw new Error("empty series");
    chartCache.set(key, { at: Date.now(), data: points });
    return points;
  } catch (e) {
    console.warn("[crypto] chart unavailable:", (e as any)?.message);
    const m = await getMarket(id);
    const series = syntheticSeries(id, m?.price_eur || 100, Number(days) || 7, m?.change_24h || 0);
    chartCache.set(key, { at: Date.now() - CHART_TTL / 2, data: series });
    return series;
  }
}

// ── persistence ─────────────────────────────────────────────────────────────
async function persistPrices(markets: Market[]) {
  try {
    const sb = supabaseAdmin();
    await sb.from("crypto_price_cache").upsert(
      markets.map((m) => ({
        asset_id: m.id,
        price_eur: m.price_eur,
        change_24h: m.change_24h,
        change_7d: m.change_7d,
        market_cap: m.market_cap,
        volume_24h: m.volume_24h,
        high_24h: m.high_24h,
        low_24h: m.low_24h,
        sparkline: m.sparkline,
        image: m.image,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "asset_id" }
    );
  } catch {
    /* best effort */
  }
}

async function readPersistedPrices(assets: Asset[]): Promise<Market[] | null> {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.from("crypto_price_cache").select("*");
    if (!data || !data.length) return null;
    const byId = new Map(data.map((r: any) => [r.asset_id, r]));
    return assets.map((a) => {
      const r = byId.get(a.id);
      if (!r) return synthetic(a, true);
      return {
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        network: a.network,
        color: a.color || "#c9a227",
        price_eur: Number(r.price_eur) || 0,
        change_24h: Number(r.change_24h) || 0,
        change_7d: Number(r.change_7d) || 0,
        market_cap: Number(r.market_cap) || 0,
        volume_24h: Number(r.volume_24h) || 0,
        high_24h: Number(r.high_24h) || 0,
        low_24h: Number(r.low_24h) || 0,
        sparkline: Array.isArray(r.sparkline) ? r.sparkline : [],
        image: logoFor(a.symbol, r.image),
        stale: true,
      };
    });
  } catch {
    return null;
  }
}

// ── synthetic fallback ──────────────────────────────────────────────────────
const ANCHOR_EUR: Record<string, number> = {
  bitcoin: 92_400, ethereum: 3_180, tether: 0.92, solana: 168, "usd-coin": 0.92,
  ripple: 2.05, cardano: 0.83, "avalanche-2": 33.5, chainlink: 19.4, polkadot: 6.1,
  litecoin: 96, dogecoin: 0.31, "polygon-ecosystem-token": 0.42, tron: 0.24,
  uniswap: 12.4, stellar: 0.38, cosmos: 6.4, near: 5.1, aave: 285, arbitrum: 0.72,
  optimism: 1.55, "injective-protocol": 21.5, "render-token": 7.4, "the-graph": 0.21,
  algorand: 0.33, filecoin: 4.6, "hedera-hashgraph": 0.27, sui: 3.9, mantle: 1.05,
  monero: 178,
};

function seedFrom(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function synthetic(a: Asset, stale: boolean): Market {
  const base = ANCHOR_EUR[a.id] || 1 + (seedFrom(a.id) % 900) / 7;
  // Drift the anchor by the hour so the demo desk doesn't look frozen.
  const r = rng(seedFrom(a.id) + Math.floor(Date.now() / 3_600_000));
  const change = (r() - 0.45) * 9;
  const price = base * (1 + change / 100);
  return {
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    network: a.network,
    color: a.color || "#c9a227",
    price_eur: price,
    change_24h: change,
    change_7d: change * 1.8,
    market_cap: price * (1_000_000 + (seedFrom(a.id) % 900_000)) * 40,
    volume_24h: price * (50_000 + (seedFrom(a.symbol) % 400_000)),
    high_24h: price * 1.03,
    low_24h: price * 0.96,
    sparkline: syntheticSeries(a.id, price, 7, change).map((p) => p.p),
    image: logoFor(a.symbol),
    stale,
  };
}

function syntheticSeries(id: string, price: number, days: number, drift: number): ChartPoint[] {
  const n = days <= 1 ? 96 : days <= 7 ? 168 : days <= 30 ? 120 : 180;
  const r = rng(seedFrom(id));
  const span = Math.max(1, days) * 86_400_000;
  const out: ChartPoint[] = [];
  let p = price / (1 + drift / 100);
  for (let i = 0; i < n; i++) {
    p *= 1 + (r() - 0.5) * 0.018 + drift / 100 / n;
    out.push({ t: Date.now() - span + (span * i) / n, p: Math.max(p, 0.0000001) });
  }
  // Land the series exactly on the current price.
  out[out.length - 1] = { t: Date.now(), p: price };
  return out;
}

// ── pricing maths ───────────────────────────────────────────────────────────
export type Quote = {
  asset_id: string;
  symbol: string;
  side: "buy" | "sell";
  mid_price_eur: number;
  unit_price_eur: number;
  spread_bps: number;
  fee_eur: number;
  eur_amount: number;    // total the customer pays (buy) or receives (sell)
  net_eur: number;       // amount actually converted after the fee
  quantity: number;      // coin amount
  expires_at: number;
  stale: boolean;
};

export function buildQuote(
  market: Market,
  side: "buy" | "sell",
  input: { eur?: number; quantity?: number }
): Quote {
  const mid = market.price_eur;
  const spread = DESK.SPREAD_BPS / 10_000;
  const unit = side === "buy" ? mid * (1 + spread) : mid * (1 - spread);

  let eurAmount: number;
  let quantity: number;
  let fee: number;

  if (side === "buy") {
    eurAmount = round2(Number(input.eur) || 0);
    fee = eurAmount >= DESK.FLAT_FEE_WAIVER_EUR ? 0 : DESK.FLAT_FEE_EUR;
    const net = Math.max(0, round2(eurAmount - fee));
    quantity = unit > 0 ? net / unit : 0;
    return {
      asset_id: market.id, symbol: market.symbol, side,
      mid_price_eur: mid, unit_price_eur: unit, spread_bps: DESK.SPREAD_BPS,
      fee_eur: fee, eur_amount: eurAmount, net_eur: net,
      quantity: floorTo(quantity, 10), expires_at: Date.now() + 45_000,
      stale: market.stale,
    };
  }

  quantity = Number(input.quantity) || 0;
  const gross = round2(quantity * unit);
  fee = gross >= DESK.FLAT_FEE_WAIVER_EUR ? 0 : DESK.FLAT_FEE_EUR;
  const proceeds = Math.max(0, round2(gross - fee));
  return {
    asset_id: market.id, symbol: market.symbol, side,
    mid_price_eur: mid, unit_price_eur: unit, spread_bps: DESK.SPREAD_BPS,
    fee_eur: fee, eur_amount: proceeds, net_eur: gross,
    quantity: floorTo(quantity, 10), expires_at: Date.now() + 45_000,
    stale: market.stale,
  };
}

export function validateAddress(asset: Asset, address: string): string | null {
  const addr = (address || "").trim();
  if (!addr) return "Enter the destination address.";
  if (addr.length < 12) return "That address looks too short.";
  if (asset.address_regex) {
    try {
      if (!new RegExp(asset.address_regex).test(addr)) {
        return `That doesn't look like a valid ${asset.network} address.`;
      }
    } catch {
      /* a bad regex in the catalogue must never block a withdrawal */
    }
  }
  return null;
}

/**
 * Coin artwork.
 *
 * The logo used to come only from the CoinGecko markets response — so any time
 * that feed was rate-limited, cold, or falling back to the DB cache, `image`
 * came back empty and every coin rendered as a lettered disc. That is exactly
 * what was happening on the dashboard and the desk.
 *
 * jsDelivr serves the `cryptocurrency-icons` package from a CDN, keyed by
 * ticker, with no key and no rate limit. It is now the reliable default and
 * the live feed's own URL is only a bonus. Anything missing still degrades to
 * initials in <CoinBadge>.
 */
export function logoFor(symbol: string, feedImage?: string): string {
  if (feedImage) return feedImage;
  const t = (symbol || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!t) return "";
  return `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${t}.svg`;
}

export function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function floorTo(n: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.floor((Number(n) || 0) * f) / f;
}

/** Coin amounts need more precision than money — 0.00042318 BTC etc. */
export function fmtCoin(n: number | string, symbol?: string) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const dp = abs === 0 ? 2 : abs < 0.001 ? 8 : abs < 1 ? 6 : abs < 1000 ? 4 : 2;
  // en-GB gives 10,000.50 — comma thousands, dot decimal. Consistent with
  // fmtMoney across the whole app.
  const s = v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: dp });
  return symbol ? `${s} ${symbol}` : s;
}

/** Price formatting that keeps cheap coins readable (0,00002841 €). */
export function fmtPrice(n: number | string) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const dp = abs === 0 ? 2 : abs < 0.01 ? 8 : abs < 1 ? 4 : abs < 1000 ? 2 : 2;
  return `${v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: dp })} €`;
}

export function fmtCompact(n: number | string) {
  const v = Number(n) || 0;
  // Plain English abbreviations — "Mrd" and "Tsd" are German and meaningless
  // to most of the euro area.
  if (v >= 1e12) return `€${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `€${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `€${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(1)}K`;
  return `${v.toFixed(2)} €`;
}
