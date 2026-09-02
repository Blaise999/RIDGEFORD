/**
 * Money and dates across the euro area.
 *
 * Every euro country writes the amount differently — 1.234,56 € in Berlin and
 * Madrid, 1 234,56 € in Paris, €1,234.56 in Dublin — so the locale travels with
 * the customer rather than being hardcoded to Germany. `EURO_LOCALE` maps the
 * twenty-one members to the locale their customers actually read.
 */
export const EURO_LOCALE: Record<string, string> = {
  AT: "de-AT", BE: "nl-BE", BG: "bg-BG", HR: "hr-HR", CY: "el-CY", EE: "et-EE",
  FI: "fi-FI", FR: "fr-FR", DE: "de-DE", GR: "el-GR", IE: "en-IE", IT: "it-IT",
  LV: "lv-LV", LT: "lt-LT", LU: "fr-LU", MT: "en-MT", NL: "nl-NL", PT: "pt-PT",
  SK: "sk-SK", SI: "sl-SI", ES: "es-ES",
};

/** Locale for a customer's country of residence, falling back to euro-neutral. */
export function localeFor(country?: string | null) {
  if (!country) return "de-DE";
  return EURO_LOCALE[country.toUpperCase()] || "de-DE";
}

/**
 * Format a EUR amount for a given locale. Defaults to the German grouping
 * because that is where the bank is licensed, but pass the customer's country
 * anywhere the figure is shown to them.
 */
export function fmtMoneyIn(n: number | string, country?: string | null, cents = false) {
  const raw = typeof n === "string" ? Number(n) : n;
  const num = Number.isFinite(raw) ? raw : 0;
  try {
    return new Intl.NumberFormat(localeFor(country), {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    }).format(num);
  } catch {
    return fmtMoney(num);
  }
}

export function fmtMoney(n: number | string, currency = "EUR", _locale = "de-DE") {
  const raw = typeof n === "string" ? Number(n) : n;
  const num = Number.isFinite(raw) ? raw : 0;
  const sign = num < 0 ? "−" : "";
  const abs = Math.round(Math.abs(num));
  // Comma thousands separator: 10,000 — not the German 10.000. A dot between
  // thousands reads as a decimal point to most of the world, and on a bank
  // balance that ambiguity is not worth the local authenticity.
  const withSep = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sym = currency === "EUR" ? "€" : currency;
  return `${sign}${withSep}\u00A0${sym}`;
}

/** Plain integer with `.` grouping, no symbol. */
export function fmtInt(n: number | string) {
  const v = Math.round(Number(n || 0));
  const sign = v < 0 ? "−" : "";
  return sign + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Format a compact date label. Pass the customer's locale where you have it. */
export function fmtDate(d: string | Date, locale = "de-DE") {
  const dt = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  } catch {
    return dt.toISOString().slice(0, 10);
  }
}

/** Friendly relative date (Today / Yesterday / DD Mon). */
export function fmtRelativeDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (isSame(dt, today)) return "Today";
  if (isSame(dt, yest)) return "Yesterday";
  return fmtDate(dt);
}

/** Mask an IBAN for display: DE89 **** **** **** 3000 */
export function maskIban(iban?: string | null) {
  if (!iban) return "—";
  const raw = iban.replace(/\s+/g, "");
  if (raw.length < 8) return iban;
  const head = raw.slice(0, 4);
  const tail = raw.slice(-4);
  const groups = Math.max(0, Math.floor((raw.length - 8) / 4));
  const mid = Array(groups).fill("****").join(" ");
  return `${head} ${mid} ${tail}`.replace(/\s+/g, " ").trim();
}

/**
 * Account numbers are issued from the German licence, but the check digits are
 * computed for real in lib/iban.ts — every IBAN this bank hands out passes a
 * genuine mod-97 validator.
 */
export { generateIban, formatIban, verifyIban, normalizeIban } from "./iban";

/** Human reference, e.g. "TR-7F3A29". */
export function genReference(prefix = "TR") {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${hex}`;
}

/** Short hash used for avatars / color seeds. */
export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Clamp helper. */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Small classnames joiner. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
