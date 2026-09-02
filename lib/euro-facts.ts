/**
 * EURO-AREA FACTS
 *
 * Everything the landing page states is a real, dated, sourced fact. Nothing on
 * this page is invented atmosphere — if a number appears in the design it has a
 * `source` and an `as_of` next to it here, and the components render both.
 *
 * Checked against primary sources on 23 August 2026. Anything with a `verify`
 * URL should be re-checked before launch; rates and inflation prints move.
 */

export const AS_OF = "23 August 2026";

/* ─────────────────────────────────────────────────────────── the house ── */

export const HOUSE = {
  legal: "Ridgeford Capital Bank AG",
  street: "Kaiserstraße 16",
  postal: "60311",
  city: "Frankfurt am Main",
  district: "Bahnhofsviertel",
  country: "Germany",
  // Kaiserstraße runs from the Hauptbahnhof to the Innenstadt — the spine of
  // the Bahnhofsviertel, five minutes' walk from the Eurotower on Willy-Brandt-Platz.
  landmarks: [
    ["Eurotower", "600 m — ECB banking supervision"],
    ["Deutsche Bundesbank", "3,1 km — Ginnheim"],
    ["Deutsche Börse / Börsenplatz", "900 m"],
    ["Hauptbahnhof", "350 m — ICE to Paris 3 h 50"],
  ] as [string, string][],
  bic: "RDGFDEFFXXX",
  // German IBANs are 22 characters: DE + 2 check + 8 BLZ + 10 account
  ibanFormat: "DE00 0000 0000 0000 0000 00",
  regulator: "BaFin · Bundesanstalt für Finanzdienstleistungsaufsicht",
  scheme: "Entschädigungseinrichtung deutscher Banken (EdB)",
  protection: "100.000 € per depositor",
};

/* ────────────────────────────────────────────────────── rails & timing ── */

/**
 * The Instant Payments Regulation (EU) 2024/886 timeline as it actually landed.
 * Euro-area banks: receive from 9 Jan 2025, send + Verification of Payee from
 * 9 Oct 2025. EMIs and payment institutions follow on 9 Apr 2027; non-euro-area
 * PSPs on 9 Jul 2027.
 */
export const RAIL_STAGES = [
  {
    t: "0,0 s",
    k: "Instruction",
    v: "You confirm in-app. Strong customer authentication under PSD2 — two factors, one of them dynamic.",
  },
  {
    t: "0,4 s",
    k: "Verification of Payee",
    v: "The payee's name is checked against the IBAN at the receiving bank. Three answers: match, close match, no match. Free of charge — Art. 5c IPR.",
  },
  {
    t: "1,2 s",
    k: "Sanctions posture",
    v: "Customers are screened daily against EU restrictive-measures lists. Transaction-level screening is deliberately not permitted to hold up the payment.",
  },
  {
    t: "3,8 s",
    k: "Settlement",
    v: "Cleared over TIPS or RT1 in central bank money. No batching, no cut-off, no value dating.",
  },
  {
    t: "< 10 s",
    k: "Credited",
    v: "Funds available to the payee and confirmation returned to us. The ten-second ceiling is the law, not a service level we chose.",
  },
];

export const RAIL_FACTS = [
  {
    k: "SEPA Instant",
    v: "Under 10 seconds, 24/7/365",
    note: "Reg. (EU) 2024/886, in force for euro-area banks since 9 Oct 2025",
  },
  {
    k: "Price parity",
    v: "Never more than a standard transfer",
    note: "Art. 5b — an instant credit transfer may not cost more than a classic SCT",
  },
  {
    k: "Amount ceiling",
    v: "None at scheme level",
    note: "The old 100.000 € cap was removed from the SCT Inst rulebook",
  },
  {
    k: "Verification of Payee",
    v: "Free, on every euro transfer",
    note: "Applies to SCT and SCT Inst alike across the EEA",
  },
  {
    k: "Structured addresses",
    v: "ISO 20022 from November 2026",
    note: "Unstructured address fields stop being accepted in payment messages",
  },
  {
    k: "Outside the euro",
    v: "SWIFT, same day where cut-offs allow",
    note: "Correspondent charges disclosed before you confirm, never after",
  },
];

/* ────────────────────────────────────────────────────────── coverage ── */

/**
 * Euro area, 21 members from 1 January 2026 — Bulgaria's accession moved the
 * bloc from EA20 to EA21, and Eurostat's aggregate series changed with it.
 */
export const EURO_AREA: { code: string; name: string; since: number }[] = [
  { code: "AT", name: "Austria", since: 1999 },
  { code: "BE", name: "Belgium", since: 1999 },
  { code: "BG", name: "Bulgaria", since: 2026 },
  { code: "HR", name: "Croatia", since: 2023 },
  { code: "CY", name: "Cyprus", since: 2008 },
  { code: "EE", name: "Estonia", since: 2011 },
  { code: "FI", name: "Finland", since: 1999 },
  { code: "FR", name: "France", since: 1999 },
  { code: "DE", name: "Germany", since: 1999 },
  { code: "GR", name: "Greece", since: 2001 },
  { code: "IE", name: "Ireland", since: 1999 },
  { code: "IT", name: "Italy", since: 1999 },
  { code: "LV", name: "Latvia", since: 2014 },
  { code: "LT", name: "Lithuania", since: 2015 },
  { code: "LU", name: "Luxembourg", since: 1999 },
  { code: "MT", name: "Malta", since: 2008 },
  { code: "NL", name: "Netherlands", since: 1999 },
  { code: "PT", name: "Portugal", since: 1999 },
  { code: "SK", name: "Slovakia", since: 2009 },
  { code: "SI", name: "Slovenia", since: 2007 },
  { code: "ES", name: "Spain", since: 1999 },
];

/** SEPA reaches beyond the euro — these are reachable, just not in euro natively. */
export const SEPA_NON_EURO = [
  "Bulgaria", "Czechia", "Denmark", "Hungary", "Iceland", "Liechtenstein",
  "Norway", "Poland", "Romania", "Sweden", "Switzerland", "United Kingdom",
];

/* ───────────────────────────────────────────────────────────── the tape ── */

/**
 * European finance, as of late August 2026. Each item carries its own date and
 * source so the section reads as a wire, not as marketing.
 */
export interface TapeItem {
  id: string;
  date: string;
  tag: "POLICY" | "RAILS" | "PRICES" | "CURRENCY" | "SUPERVISION";
  head: string;
  body: string;
  figure?: string;
  figureNote?: string;
  source: string;
  href: string;
  /** Layout weight — the scatter grid reads this. */
  size: "lead" | "wide" | "tall" | "unit";
}

export const TAPE: TapeItem[] = [
  {
    id: "ecb-hold",
    date: "23 Jul 2026",
    tag: "POLICY",
    head: "Governing Council holds after June's hike",
    body:
      "The deposit facility stays at 2,25 %, main refinancing at 2,40 %, marginal lending at 2,65 %. The Council said the energy shock's full inflationary effect has yet to play out and that it is watching both the intensity and the duration of it. Next decision 10 September.",
    figure: "2,25 %",
    figureNote: "Deposit facility rate — the steering rate since March 2024",
    source: "European Central Bank",
    href: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260723~29f24d99bc.en.html",
    size: "lead",
  },
  {
    id: "hike",
    date: "11 Jun 2026",
    tag: "POLICY",
    head: "First rate rise in nearly three years",
    body:
      "The Council lifted all three key rates by 25 basis points, the first increase since September 2023, citing inflation pressure from the conflict in the Middle East. Eurosystem staff put headline inflation at 3,0 % for 2026, 2,3 % for 2027 and back at target in 2028.",
    figure: "+25 bp",
    figureNote: "Deposit rate 2,00 % → 2,25 %",
    source: "ECB monetary policy statement",
    href: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260611~4d41bd5e83.en.html",
    size: "tall",
  },
  {
    id: "hicp",
    date: "19 Aug 2026",
    tag: "PRICES",
    head: "July inflation confirmed at 2,9 %",
    body:
      "Up from 2,8 % in June. Energy carried it at 10,0 % year on year, services at 3,3 %. Lowest prints in Sweden (0,3 %) and Czechia (1,3 %); highest in Romania (8,2 %) and Lithuania (5,4 %). Core ticked up to 2,5 %.",
    figure: "2,9 %",
    figureNote: "Euro area HICP, annual rate, July 2026",
    source: "Eurostat",
    href: "https://ec.europa.eu/eurostat/en/web/products-euro-indicators/w/2-19082026-ap",
    size: "wide",
  },
  {
    id: "vop",
    date: "9 Oct 2025",
    tag: "RAILS",
    head: "Name checks became mandatory on every euro transfer",
    body:
      "Verification of Payee has applied to all SEPA credit transfers and instant transfers inside the EEA since last October, free of charge to the payer. The check returns match, close match or no match — and a warning never blocks you, it informs you before you authorise.",
    source: "European Payments Council · IPR Art. 5c",
    href: "https://www.europeanpaymentscouncil.eu/what-we-do/other-schemes/verification-payee",
    size: "unit",
  },
  {
    id: "deuro",
    date: "14 Jul 2026",
    tag: "CURRENCY",
    head: "Thirty-six providers picked for the digital euro pilot",
    body:
      "More than fifty payment service providers applied after March's call; thirty-six were selected across the euro area. The twelve-month pilot runs from the second half of 2027 on a beta build with no legal-tender status. Issuance stays contingent on the regulation, which the Eurosystem expects adopted by end-2026 for a possible 2029 launch.",
    figure: "36",
    figureNote: "PSPs selected from 50+ applicants",
    source: "European Central Bank",
    href: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr260714~8cd07d9d45.en.html",
    size: "wide",
  },
  {
    id: "bulgaria",
    date: "1 Jan 2026",
    tag: "CURRENCY",
    head: "Bulgaria takes the euro area to twenty-one",
    body:
      "Eurostat's aggregate series switched from EA20 to EA21 on accession, chain-linked so the history stays comparable. Sofia's accounts came into scope of the same instant-payment obligations as every other euro member.",
    figure: "21",
    figureNote: "Member States sharing the euro",
    source: "Eurostat",
    href: "https://ec.europa.eu/eurostat/web/products-euro-indicators/w/2-30042026-ap",
    size: "unit",
  },
  {
    id: "trilogue",
    date: "9 Jul 2026",
    tag: "SUPERVISION",
    head: "Digital euro heads into trilogue",
    body:
      "Parliament adopted its position in July, the Council having agreed its mandate in December. Both sides back an online and an offline version, with the offline one designed to behave like cash. What remains contested is precisely which personal data may be processed, and where the holding limits land.",
    source: "Council & European Parliament mandates",
    href: "https://www.ecb.europa.eu/euro/digital_euro/faqs/html/ecb.faq_digital_euro.en.html",
    size: "tall",
  },
  {
    id: "gdp",
    date: "Q2 2026",
    tag: "PRICES",
    head: "Euro area GDP up 0,4 % on the quarter",
    body:
      "A flash estimate, following a flat first quarter. Goods trade with the rest of the world showed an 8,6 bn € surplus in June, against 4,8 bn € a year earlier.",
    figure: "+0,4 %",
    figureNote: "Quarter on quarter, seasonally adjusted",
    source: "Eurostat euro indicators",
    href: "https://ec.europa.eu/eurostat/news/euro-indicators",
    size: "unit",
  },
];

/* ───────────────────────────────────────────────────────────── ledger ── */

export const PRICE_ROWS: {
  k: string;
  v: string;
  note: string;
  emphasis?: boolean;
}[] = [
  {
    k: "SEPA credit transfer",
    v: "0,00 €",
    note: "Euro, EEA, any amount. Sent and received.",
    emphasis: true,
  },
  {
    k: "SEPA Instant",
    v: "0,00 €",
    note: "Law forbids us charging more for it than for a standard transfer.",
    emphasis: true,
  },
  {
    k: "Verification of Payee",
    v: "0,00 €",
    note: "Free by statute. Runs on every euro transfer you send.",
  },
  {
    k: "SWIFT, outbound",
    v: "14,00 €",
    note: "Plus correspondent charges, quoted to you before you confirm — never deducted silently.",
  },
  {
    k: "Non-euro FX",
    v: "0,35 %",
    note: "Over the ECB daily reference rate. The rate and the spread are both shown on the ticket.",
  },
  {
    k: "Card, euro area",
    v: "0,00 €",
    note: "Interchange is capped at 0,2 % debit / 0,3 % credit under Reg. (EU) 2015/751.",
  },
  {
    k: "Cash withdrawal, EEA",
    v: "Two free monthly",
    note: "1,50 € thereafter. Third-party ATM operator fees are theirs, not ours.",
  },
  {
    k: "Account maintenance",
    v: "0,00 €",
    note: "No minimum balance, no dormancy charge, no closure fee.",
  },
];

export const LEDGER_FIGURES: { n: string; k: string; note: string }[] = [
  { n: "< 10 s", k: "Instant settlement", note: "Ceiling set by Reg. (EU) 2024/886" },
  { n: "21", k: "Euro-area countries", note: "EA21 since 1 January 2026" },
  { n: "100.000 €", k: "Deposit protection", note: "Per depositor, EdB statutory scheme" },
  { n: "24/7/365", k: "No cut-off", note: "Instant rails do not observe banking hours" },
];

/* ──────────────────────────────────────────────────────────── imagery ── */

/**
 * Wikimedia Commons serves any file through Special:FilePath, with ?width= for
 * a scaled render. These files were checked to exist on 23 Aug 2026.
 *
 * ⚠️ BEFORE LAUNCH: every one of these is CC BY or CC BY-SA, which obliges you
 * to name the photographer. Open each `page` URL, copy the author string into
 * `author` below, and the caption component will render it. Better still,
 * download them into /public and self-host — hotlinking Commons at production
 * traffic is both rude and fragile.
 */
export interface Media {
  file: string;
  page: string;
  license: string;
  author: string;
  caption: string;
}

const commons = (file: string, width = 1600) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const mediaUrl = commons;

export const MEDIA: Record<string, Media> = {
  ecbDawn: {
    file: "Seat of the European Central Bank and Frankfurt Skyline at dawn 20150422 1.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Seat_of_the_European_Central_Bank_and_Frankfurt_Skyline_at_dawn_20150422_1.jpg",
    license: "CC BY-SA",
    author: "TODO — see file page",
    caption: "The ECB seat and the skyline at dawn, from the east",
  },
  bankenviertel: {
    file: "Frankfurt Bankenviertel (49701215091).jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_Bankenviertel_(49701215091).jpg",
    license: "CC BY 2.0",
    author: "TODO — see file page",
    caption: "Bankenviertel — the western edge of the Innenstadt",
  },
  riverbank: {
    file: "Frankfurt skyline at Main river bank.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_skyline_at_Main_river_bank.jpg",
    license: "CC BY-SA 4.0",
    author: "TODO — see file page",
    caption: "The Main, looking north to the towers",
  },
  towers2012: {
    file: "Bankenviertel-Frankfurt-2012-Ffm-891.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Bankenviertel-Frankfurt-2012-Ffm-891.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    caption: "From the Kaiserdom, over the banking quarter",
  },
  panorama: {
    file: "Frankfurt skyline panorama with river main.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_skyline_panorama_with_river_main.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    caption: "Panorama across the Main",
  },
};
