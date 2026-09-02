/**
 * IBAN — SEPA registry, validation, and reachability.
 *
 * Ridgeford is licensed in Germany and issues DE IBANs, but it banks the whole
 * euro area: a customer in Lisbon, Ljubljana or Sofia pays a beneficiary in any
 * of the twenty-one euro members on the same rails, at the same price, under
 * the same regulation. Everything here is therefore country-agnostic — the only
 * DE-specific thing left in the codebase is our own BLZ.
 *
 * Lengths and structures follow the SWIFT IBAN Registry. Validation is the real
 * ISO 13616 mod-97 check, not a length check pretending to be one.
 */

export interface IbanCountry {
  code: string;
  name: string;
  length: number;
  /** Euro is the national currency → instant euro rails, no FX. */
  euro: boolean;
  /** Inside SEPA → euro credit transfers reachable, possibly with FX. */
  sepa: boolean;
  /** Local name for the bank identifier, used in UI copy. */
  bankLabel?: string;
}

export const IBAN_COUNTRIES: IbanCountry[] = [
  // ── euro area (EA21 since Bulgaria joined on 1 January 2026) ──────────
  { code: "AT", name: "Austria", length: 20, euro: true, sepa: true, bankLabel: "Bankleitzahl" },
  { code: "BE", name: "Belgium", length: 16, euro: true, sepa: true },
  { code: "BG", name: "Bulgaria", length: 22, euro: true, sepa: true },
  { code: "HR", name: "Croatia", length: 21, euro: true, sepa: true },
  { code: "CY", name: "Cyprus", length: 28, euro: true, sepa: true },
  { code: "EE", name: "Estonia", length: 20, euro: true, sepa: true },
  { code: "FI", name: "Finland", length: 18, euro: true, sepa: true },
  { code: "FR", name: "France", length: 27, euro: true, sepa: true, bankLabel: "Code banque" },
  { code: "DE", name: "Germany", length: 22, euro: true, sepa: true, bankLabel: "Bankleitzahl" },
  { code: "GR", name: "Greece", length: 27, euro: true, sepa: true },
  { code: "IE", name: "Ireland", length: 22, euro: true, sepa: true, bankLabel: "Sort code" },
  { code: "IT", name: "Italy", length: 27, euro: true, sepa: true, bankLabel: "ABI / CAB" },
  { code: "LV", name: "Latvia", length: 21, euro: true, sepa: true },
  { code: "LT", name: "Lithuania", length: 20, euro: true, sepa: true },
  { code: "LU", name: "Luxembourg", length: 20, euro: true, sepa: true },
  { code: "MT", name: "Malta", length: 31, euro: true, sepa: true },
  { code: "NL", name: "Netherlands", length: 18, euro: true, sepa: true },
  { code: "PT", name: "Portugal", length: 25, euro: true, sepa: true, bankLabel: "NIB" },
  { code: "SK", name: "Slovakia", length: 24, euro: true, sepa: true },
  { code: "SI", name: "Slovenia", length: 19, euro: true, sepa: true },
  { code: "ES", name: "Spain", length: 24, euro: true, sepa: true, bankLabel: "Código de entidad" },

  // ── SEPA, outside the euro ───────────────────────────────────────────
  { code: "CZ", name: "Czechia", length: 24, euro: false, sepa: true },
  { code: "DK", name: "Denmark", length: 18, euro: false, sepa: true },
  { code: "HU", name: "Hungary", length: 28, euro: false, sepa: true },
  { code: "IS", name: "Iceland", length: 26, euro: false, sepa: true },
  { code: "LI", name: "Liechtenstein", length: 21, euro: false, sepa: true },
  { code: "NO", name: "Norway", length: 15, euro: false, sepa: true },
  { code: "PL", name: "Poland", length: 28, euro: false, sepa: true },
  { code: "RO", name: "Romania", length: 24, euro: false, sepa: true },
  { code: "SE", name: "Sweden", length: 24, euro: false, sepa: true },
  { code: "CH", name: "Switzerland", length: 21, euro: false, sepa: true },
  { code: "GB", name: "United Kingdom", length: 22, euro: false, sepa: true, bankLabel: "Sort code" },
  { code: "MC", name: "Monaco", length: 27, euro: true, sepa: true },
  { code: "SM", name: "San Marino", length: 27, euro: true, sepa: true },
  { code: "AD", name: "Andorra", length: 24, euro: true, sepa: true },
  { code: "VA", name: "Vatican City", length: 22, euro: true, sepa: true },

  // ── common non-SEPA destinations, so we can say *why* we're refusing ──
  { code: "TR", name: "Türkiye", length: 26, euro: false, sepa: false },
  { code: "RS", name: "Serbia", length: 22, euro: false, sepa: false },
  { code: "UA", name: "Ukraine", length: 29, euro: false, sepa: false },
  { code: "AE", name: "United Arab Emirates", length: 23, euro: false, sepa: false },
  { code: "SA", name: "Saudi Arabia", length: 24, euro: false, sepa: false },
  { code: "IL", name: "Israel", length: 23, euro: false, sepa: false },
  { code: "BR", name: "Brazil", length: 29, euro: false, sepa: false },
  { code: "GE", name: "Georgia", length: 22, euro: false, sepa: false },
  { code: "MD", name: "Moldova", length: 24, euro: false, sepa: false },
  { code: "MK", name: "North Macedonia", length: 19, euro: false, sepa: false },
  { code: "AL", name: "Albania", length: 28, euro: false, sepa: false },
  { code: "BA", name: "Bosnia and Herzegovina", length: 20, euro: false, sepa: false },
  { code: "ME", name: "Montenegro", length: 22, euro: false, sepa: false },
  { code: "TN", name: "Tunisia", length: 24, euro: false, sepa: false },
  { code: "MA", name: "Morocco", length: 28, euro: false, sepa: false },
  { code: "EG", name: "Egypt", length: 29, euro: false, sepa: false },
];

const BY_CODE = new Map(IBAN_COUNTRIES.map((c) => [c.code, c]));

export const EURO_COUNTRIES = IBAN_COUNTRIES.filter((c) => c.euro);
export const SEPA_NON_EURO_COUNTRIES = IBAN_COUNTRIES.filter((c) => c.sepa && !c.euro);

export function ibanCountry(code?: string | null): IbanCountry | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) || null;
}

/** Strip spaces and upper-case. Never mutates what the user sees mid-typing. */
export const normalizeIban = (v: string) => (v || "").replace(/[\s\u00A0-]/g, "").toUpperCase();

/** Group in fours for display: DE89 3704 0044 0532 0130 00 */
export function formatIban(v: string) {
  return normalizeIban(v).replace(/(.{4})/g, "$1 ").trim();
}

/** ISO 13616 mod-97. Returns true only if the checksum genuinely passes. */
export function ibanChecksumValid(v: string): boolean {
  const raw = normalizeIban(v);
  if (raw.length < 5) return false;
  const rearranged = raw.slice(4) + raw.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    let part: string;
    if (code >= 48 && code <= 57) part = ch;                     // 0-9
    else if (code >= 65 && code <= 90) part = String(code - 55); // A=10 … Z=35
    else return false;
    for (const d of part) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

export type IbanVerdict =
  | { ok: true; country: IbanCountry; formatted: string; instant: boolean; note?: string }
  | { ok: false; reason: string; country?: IbanCountry | null };

/**
 * Full check, in the order that produces the most useful error message.
 * Deliberately explicit: "we can't reach Türkiye on SEPA" is a better answer
 * than "invalid IBAN".
 */
export function verifyIban(input: string): IbanVerdict {
  const raw = normalizeIban(input);
  if (!raw) return { ok: false, reason: "Enter the beneficiary's IBAN." };
  if (raw.length < 15) return { ok: false, reason: "That IBAN is too short to be complete." };
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(raw)) {
    return { ok: false, reason: "An IBAN starts with two letters and two digits." };
  }

  const country = ibanCountry(raw.slice(0, 2));
  if (!country) {
    return { ok: false, reason: `We don't recognise the country code ${raw.slice(0, 2)}.` };
  }
  if (raw.length !== country.length) {
    return {
      ok: false,
      reason: `${country.name} IBANs are ${country.length} characters — this one is ${raw.length}.`,
      country,
    };
  }
  if (!ibanChecksumValid(raw)) {
    return {
      ok: false,
      reason: "That IBAN fails its check digits — one character is probably mistyped.",
      country,
    };
  }
  if (!country.sepa) {
    return {
      ok: false,
      reason: `${country.name} is outside SEPA. Send this one as an international transfer instead.`,
      country,
    };
  }

  return {
    ok: true,
    country,
    formatted: formatIban(raw),
    instant: country.euro,
    note: country.euro
      ? undefined
      : `${country.name} is in SEPA but outside the euro. The transfer is sent in euro; the beneficiary's bank converts on arrival at their rate.`,
  };
}

/**
 * Our own IBANs. Ridgeford holds a German licence, so customer accounts are DE
 * — but the check digits are computed properly rather than faked, so every
 * account number this bank issues passes a real IBAN validator.
 */
export function generateIban(bankCode = "50110022") {
  const rand = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
  const account = rand(10);
  const bban = `${bankCode}${account}`;
  // Compute the two check digits: move DE00 to the back, mod-97, 98 - r.
  const shifted = `${bban}131400`; // D=13, E=14, then "00"
  let remainder = 0;
  for (const d of shifted) remainder = (remainder * 10 + Number(d)) % 97;
  const check = String(98 - remainder).padStart(2, "0");
  return formatIban(`DE${check}${bban}`);
}

/**
 * Verification of Payee, as the Instant Payments Regulation defines it.
 * Art. 5c: free of charge, on every euro credit transfer, three possible
 * answers — and a warning informs the payer rather than blocking them.
 */
export type VopResult = "match" | "close_match" | "no_match" | "not_supported";

export function comparePayeeName(entered: string, onFile: string): VopResult {
  const norm = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(gmbh|ag|sa|nv|bv|srl|spa|oy|ab|as|sas|sarl|ltd|plc|kg|ohg|se)\b/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const a = norm(entered);
  const b = norm(onFile);
  if (!a || !b) return "not_supported";
  if (a === b) return "match";

  const at = new Set(a.split(" "));
  const bt = new Set(b.split(" "));
  const shared = [...at].filter((t) => bt.has(t)).length;
  const ratio = shared / Math.max(at.size, bt.size);

  if (ratio >= 0.5) return "close_match";
  // Initial + surname ("A Weber" vs "Anna Weber") is the classic close match.
  const lastA = a.split(" ").pop();
  const lastB = b.split(" ").pop();
  if (lastA && lastA === lastB) return "close_match";
  return "no_match";
}

export const VOP_COPY: Record<VopResult, { label: string; tone: "ok" | "warn" | "bad" | "mute"; body: string }> = {
  match: {
    label: "Name matches",
    tone: "ok",
    body: "The name you entered matches the account holder on file at the beneficiary's bank.",
  },
  close_match: {
    label: "Close match",
    tone: "warn",
    body: "Nearly right — the beneficiary bank holds a slightly different name for this account. Check it against something they sent you before you continue.",
  },
  no_match: {
    label: "Name does not match",
    tone: "bad",
    body: "The beneficiary's bank holds a different name for this IBAN. This is the single most common sign of an invoice-redirection scam. You can still send, but you carry the loss if it's wrong.",
  },
  not_supported: {
    label: "Check unavailable",
    tone: "mute",
    body: "The receiving bank didn't answer the name check. That's permitted for accounts outside the EEA and for non-payment accounts such as loans or fixed-term deposits.",
  },
};
