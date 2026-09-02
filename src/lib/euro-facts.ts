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
  protection: "100,000 € per depositor",
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
    note: "The old 100,000 € cap was removed from the SCT Inst rulebook",
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
  { n: "100,000 €", k: "Deposit protection", note: "Per depositor, EdB statutory scheme" },
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

/**
 * PEOPLE AND PRESS
 *
 * ⚠️ READ THIS BEFORE SHIPPING ANY OF THE `people` ENTRIES.
 *
 * These are editorial images of real, identifiable people in financial
 * settings. Using them is fine as *news context* — captioned, credited, and
 * clearly about the event. It is NOT fine to run them next to a testimonial,
 * a staff bio, or anything that implies the person banks with you or endorses
 * you: that is a personality-rights problem in every EU jurisdiction and a
 * misleading-advertising problem on top.
 *
 * So: no face on this site is ever presented as a customer or an employee. If
 * you want customer photography, buy model-released stock — that is what the
 * release is for.
 */
export const PEOPLE_MEDIA: Record<string, Media> = {
  pressRoom: {
    file: "Frankfurt Bankenviertel (49701215091).jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_Bankenviertel_(49701215091).jpg",
    license: "CC BY 2.0",
    author: "TODO — see file page",
    caption: "The quarter that sets the euro's price",
  },
};

/**
 * ECB press photography is the best source for human, newsroom-grade images of
 * euro-area finance: press conferences, the Governing Council, the Forum. The
 * ECB states you may download and use them provided the ECB is explicitly
 * cited as the source and the image is not altered or distorted.
 *
 *   https://www.ecb.europa.eu/press/contacts/html/press_photos.en.html
 *
 * They cannot be hotlinked reliably, so the workflow is: download the ones you
 * want into /public/press/, add them to PRESS_SHOTS below with the ECB credit
 * intact, and the tape zone will render them with the caption and credit.
 * Until then PRESS_SHOTS is empty and the zone degrades to text — which is why
 * nothing on the page breaks if you never do it.
 */
export interface PressShot {
  src: string;
  credit: string;
  caption: string;
  tag: string;
}

export const PRESS_SHOTS: PressShot[] = [
  // Example of the shape once you've downloaded one:
  // {
  //   src: "/press/ecb-press-conference-2026-07-23.jpg",
  //   credit: "© European Central Bank",
  //   caption: "Governing Council press conference, Frankfurt, 23 July 2026",
  //   tag: "POLICY",
  // },
];

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

/* ─────────────────────────────────────────────────── more of the wire ── */

/** Second batch — appended to TAPE so the scatter field has fourteen cards. */
export const TAPE_MORE: TapeItem[] = [
  {
    id: "sept",
    date: "10 Sep 2026",
    tag: "POLICY",
    head: "Next Governing Council decision",
    body:
      "Announced at 14:15 CET, press conference at 14:45. Markets went into August pricing roughly even odds on a further hike, having read June's move as the opening of a phase rather than a one-off. Remaining 2026 dates: 29 October and 17 December.",
    figure: "10 SEP",
    figureNote: "Frankfurt · 14:15 CET",
    source: "ECB meeting calendar",
    href: "https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html",
    size: "unit",
  },
  {
    id: "energy",
    date: "Jul 2026",
    tag: "PRICES",
    head: "Energy is doing almost all of the work",
    body:
      "At 10,0 % year on year, energy alone contributed 0,94 percentage points of July's 2,9 % print, with services adding 1,55. Strip both out and the picture is far quieter — the ex-energy index has sat between 2,2 % and 2,4 % all year.",
    figure: "+10,0 %",
    figureNote: "Energy, annual rate, July 2026",
    source: "Eurostat HICP",
    href: "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Inflation_in_the_euro_area",
    size: "tall",
  },
  {
    id: "spread",
    date: "Jul 2026",
    tag: "PRICES",
    head: "Twenty-one countries, one policy rate",
    body:
      "July's national prints ran from 2,0 % in Estonia to 3,8 % in Spain, with Germany at 2,8 %, France at 2,4 % and Italy at 2,9 %. The single rate set in Frankfurt has to fit all of them at once, which is the permanent difficulty of the euro and the reason the Council moves slowly.",
    figure: "1,8 pp",
    figureNote: "Spread between the highest and lowest euro-area print",
    source: "Eurostat · Agence Europe",
    href: "https://ec.europa.eu/eurostat/en/web/products-euro-indicators/w/2-19082026-ap",
    size: "wide",
  },
  {
    id: "emi",
    date: "9 Apr 2027",
    tag: "RAILS",
    head: "The next wave of the instant mandate",
    body:
      "Electronic money institutions and payment institutions must send and receive instant euro payments from April 2027; providers in non-euro EU states follow on 9 July 2027. Banks in the euro area — us included — have been in scope since October 2025.",
    figure: "2027",
    figureNote: "EMIs and PIs enter scope",
    source: "ECB implementation table",
    href: "https://www.ecb.europa.eu/paym/integration/retail/instant_payments/html/instant_payments_regulation.en.html",
    size: "unit",
  },
  {
    id: "iso",
    date: "Nov 2026",
    tag: "RAILS",
    head: "Structured addresses become mandatory",
    body:
      "From November, payment messages must carry ISO 20022 structured address fields — separate street, building number, postal code and town rather than free text. Unstructured addresses start being rejected, which is a quiet deadline with loud consequences for anyone still mapping legacy formats.",
    source: "ISO 20022 migration · SEPA rulebook",
    href: "https://www.europeanpaymentscouncil.eu/what-we-do/other-schemes/verification-payee",
    size: "unit",
  },
  {
    id: "cards",
    date: "2026",
    tag: "SUPERVISION",
    head: "Seventy per cent of European card payments leave Europe to be processed",
    body:
      "The dependence on Visa and Mastercard rails is the stated strategic reason behind the digital euro, alongside the decline of cash. The draft regulation puts caps on merchant fees and obliges banks to distribute it — both still contested in trilogue.",
    figure: "~70 %",
    figureNote: "Card transactions cleared on non-European infrastructure",
    source: "ECB · digital euro communications",
    href: "https://www.ecb.europa.eu/euro/digital_euro/faqs/html/ecb.faq_digital_euro.en.html",
    size: "wide",
  },
];

/* ──────────────────────────────────────────────────── product surface ── */

/**
 * What the account actually does. Written as capability + the constraint that
 * comes with it, because a feature list with no constraints in it is an advert.
 */
export const FEATURES: {
  k: string;
  head: string;
  body: string;
  spec: [string, string][];
}[] = [
  {
    k: "accounts",
    head: "Current and savings, one IBAN",
    body:
      "A German IBAN that works identically in all twenty-one euro countries — no local account needed to be paid a Spanish salary or to pay a Dutch landlord. Direct debits, standing orders and salary credits all run on the same number.",
    spec: [
      ["IBAN", "DE · 22 characters"],
      ["Currency", "EUR"],
      ["Maintenance", "0,00 €"],
      ["Minimum balance", "None"],
    ],
  },
  {
    k: "transfers",
    head: "Transfers that tell you what they are doing",
    body:
      "The country comes off the IBAN, the rail is picked from what the beneficiary can receive, and the name check runs before you authorise rather than after you regret. Where a correspondent bank will take a cut, we quote it up front instead of deducting it in transit.",
    spec: [
      ["Euro area", "Instant · under 10 s"],
      ["SEPA, non-euro", "Next working day"],
      ["Outside SEPA", "SWIFT · 14,00 €"],
      ["Name check", "Free · every transfer"],
    ],
  },
  {
    k: "spaces",
    head: "Spaces, for money with a job already",
    body:
      "Sub-balances inside the same account — rent, tax, the deposit you are not allowed to touch. Money in a Space is still your money and still protected; it simply stops appearing in the balance you spend from.",
    spec: [
      ["Sub-balances", "Unlimited"],
      ["Interest", "Tracks the account"],
      ["Protection", "Same 100,000 €"],
      ["Access", "Instant, no notice"],
    ],
  },
  {
    k: "crypto",
    head: "A digital-asset desk, priced honestly",
    body:
      "Thirty assets, bought with the euro balance in your current account and sold back into it. The spread is 1,49 % and it is printed on the ticket before you confirm. Withdrawals to an external address are reviewed before they are broadcast, because a chain transfer cannot be recalled.",
    spec: [
      ["Assets", "30"],
      ["Spread", "1,49 %"],
      ["Settlement", "From your euro balance"],
      ["Protection", "None — not a deposit"],
    ],
  },
  {
    k: "cards",
    head: "Cards, with the interchange stated",
    body:
      "Contactless and virtual cards, no fee inside the euro area. Interchange on European consumer cards is capped by regulation at 0,2 % on debit and 0,3 % on credit — we mention it because most banks would rather you did not know the number.",
    spec: [
      ["Euro-area spend", "0,00 €"],
      ["Non-euro FX", "0,35 % over ECB"],
      ["Virtual cards", "Included"],
      ["ATM, EEA", "Two free monthly"],
    ],
  },
  {
    k: "security",
    head: "Authorisation you can feel",
    body:
      "Strong customer authentication on every payment, as PSD2 requires: two factors, one of them dynamic. Large or outbound orders take a second code. It is marginally slower than a single tap, and that is the point.",
    spec: [
      ["Authentication", "PSD2 SCA"],
      ["Step-up", "Over 1,000 €"],
      ["Session", "Signed, short-lived"],
      ["Deposit cover", "100,000 € · EdB"],
    ],
  },
];

/* ────────────────────────────────────────────── imagery for the wire ── */

/**
 * Photography attached to the news cards.
 *
 * All Wikimedia Commons, all verified to exist, all served through
 * Special:FilePath with ?width= for a scaled render. Every one is CC BY or
 * CC BY-SA, which obliges you to name the photographer — open each `page` URL
 * and fill in `author` before launch, or download them into /public and
 * self-host (better: no third-party domain in your critical render path).
 *
 * Keyed by TapeItem id, so a card either has a picture or it doesn't and the
 * layout copes either way.
 */
export const TAPE_MEDIA: Record<string, { file: string; page: string; license: string; author: string; alt: string }> = {
  "ecb-hold": {
    file: "Seat of the European Central Bank and Frankfurt Skyline at dawn 20150422 1.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Seat_of_the_European_Central_Bank_and_Frankfurt_Skyline_at_dawn_20150422_1.jpg",
    license: "CC BY-SA",
    author: "TODO — see file page",
    alt: "The seat of the European Central Bank at dawn",
  },
  hike: {
    file: "Frankfurt Bankenviertel (49701215091).jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_Bankenviertel_(49701215091).jpg",
    license: "CC BY 2.0",
    author: "TODO — see file page",
    alt: "Frankfurt's banking quarter",
  },
  hicp: {
    file: "Frankfurt skyline at Main river bank.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_skyline_at_Main_river_bank.jpg",
    license: "CC BY-SA 4.0",
    author: "TODO — see file page",
    alt: "The Main and the Frankfurt skyline",
  },
  deuro: {
    file: "Bankenviertel-Frankfurt-2012-Ffm-891.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Bankenviertel-Frankfurt-2012-Ffm-891.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    alt: "Over the banking quarter from the Kaiserdom",
  },
  spread: {
    file: "Frankfurt skyline panorama with river main.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_skyline_panorama_with_river_main.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    alt: "Panorama across the Main",
  },
  energy: {
    file: "Frankfurt Skyline and River Main.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_Skyline_and_River_Main.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    alt: "Frankfurt skyline and the river Main",
  },
  cards: {
    file: "Frankfurt-Germany skyline with river Main bridge Holbeinsteg and ship excellence royal.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt-Germany_skyline_with_river_Main_bridge_Holbeinsteg_and_ship_excellence_royal.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    alt: "The Holbeinsteg and the skyline beyond",
  },
  bulgaria: {
    file: "Frankfurt skyline with river Main - Germany - April 20th 2014 - 01.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Frankfurt_skyline_with_river_Main_-_Germany_-_April_20th_2014_-_01.jpg",
    license: "CC BY-SA 3.0",
    author: "TODO — see file page",
    alt: "Frankfurt from the river",
  },
};

/* ──────────────────────────────────────────────── third batch of wire ── */

/** Appended after TAPE_MORE — twenty-two cards across the scatter field. */
export const TAPE_EXTRA: TapeItem[] = [
  {
    id: "tpi",
    date: "Aug 2026",
    tag: "RAILS",
    head: "TIPS now clears in about five seconds end to end",
    body:
      "The Eurosystem's instant settlement service runs continuously in central bank money, which is why an instant euro payment has no counterparty risk sitting between the two banks. Volumes roughly tripled through 2025 as the send mandate bit.",
    figure: "~5 s",
    figureNote: "Median end-to-end on TIPS",
    source: "ECB · TARGET Instant Payment Settlement",
    href: "https://www.ecb.europa.eu/paym/target/tips/html/index.en.html",
    size: "unit",
  },
  {
    id: "fraud",
    date: "2026",
    tag: "SUPERVISION",
    head: "Why the name check arrived when it did",
    body:
      "Authorised push payment fraud — where the payer is tricked into sending the money themselves — became the single largest category of payment fraud in Europe. Verification of Payee exists because sanctions screening and 3-D Secure do nothing about a payment you made on purpose to the wrong person.",
    source: "European Payments Council",
    href: "https://www.europeanpaymentscouncil.eu/what-we-do/other-schemes/verification-payee",
    size: "wide",
  },
  {
    id: "cash",
    date: "2026",
    tag: "CURRENCY",
    head: "Cash is still legal tender, and the ECB keeps saying so",
    body:
      "The digital euro regulation runs alongside a second file guaranteeing the acceptance and availability of banknotes. The Eurosystem's line has been consistent: a digital euro is an addition to cash, not its replacement — partly to answer exactly the objection you would expect.",
    source: "ECB · digital euro FAQ",
    href: "https://www.ecb.europa.eu/euro/digital_euro/faqs/html/ecb.faq_digital_euro.en.html",
    size: "unit",
  },
  {
    id: "wages",
    date: "Q2 2026",
    tag: "PRICES",
    head: "Negotiated wage growth keeps cooling",
    body:
      "The Council has leaned on wage settlements as the signal for whether an energy shock turns into a wage-price spiral. Second-round effects have stayed contained so far, which is the stated reason July was a hold rather than a second hike.",
    source: "ECB monetary policy statement",
    href: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260723~29f24d99bc.en.html",
    size: "unit",
  },
  {
    id: "tgt",
    date: "2026",
    tag: "RAILS",
    head: "T2 moves roughly two trillion euro a day",
    body:
      "The Eurosystem's large-value system settles the interbank leg of almost everything — securities, FX, the balances behind your card payments. Your ten-second transfer is the retail surface of a machine most people never see.",
    figure: "≈ €2 tn",
    figureNote: "Daily turnover across T2",
    source: "ECB · TARGET Services",
    href: "https://www.ecb.europa.eu/paym/target/html/index.en.html",
    size: "tall",
  },
  {
    id: "mica",
    date: "2026",
    tag: "SUPERVISION",
    head: "MiCA is fully in force across the bloc",
    body:
      "Markets in Crypto-Assets now governs issuance and service provision euro-area wide, with stablecoin issuers under reserve and redemption obligations. It is the reason a bank can run a digital-asset desk in Europe at all — and the reason the disclosures on ours are as blunt as they are.",
    source: "Reg. (EU) 2023/1114",
    href: "https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica",
    size: "wide",
  },
  {
    id: "bg-rates",
    date: "Jan 2026",
    tag: "CURRENCY",
    head: "What changed in Sofia overnight",
    body:
      "Bulgarian accounts were redenominated at the fixed conversion rate, dual pricing ran either side of the switch, and the lev's thirty-year currency board ended. Bulgarian banks came into scope of the same instant-payment obligations as every other euro member on day one.",
    source: "European Commission · euro changeover",
    href: "https://ec.europa.eu/eurostat/web/products-euro-indicators/w/2-30042026-ap",
    size: "unit",
  },
  {
    id: "sca",
    date: "2026",
    tag: "SUPERVISION",
    head: "PSD3 is still in negotiation",
    body:
      "The successor to PSD2 folds the conduct rules into a directly applicable regulation and tightens fraud liability where a bank's own name was spoofed. Nothing is in force yet; the current rulebook is still PSD2, which is what the two-factor step on every payment here comes from.",
    source: "European Commission · payment services review",
    href: "https://finance.ec.europa.eu/consumer-finance-and-payments/payment-services_en",
    size: "unit",
  },
];

/* ───────────────────────────────────────────────────────── faces ──── */

/**
 * PEOPLE ON THE WIRE
 *
 * Filenames are NOT hardcoded here. The previous version guessed Wikimedia
 * filenames and half of them 404'd, which is why no faces appeared. Instead
 * each person is identified by their Wikipedia article title, and
 * /api/faces resolves the portrait at runtime through Wikipedia's REST
 * summary endpoint (keyless, cached). A face that cannot be resolved falls
 * back to initials, so the layout never breaks.
 *
 * ⚠️ THE RULE, which matters more than the pictures:
 *
 * These are real, identifiable public figures. They appear ONLY as news
 * context — captioned with who they are and what they run, attached to a
 * story genuinely about their institution. That is ordinary editorial use.
 *
 * Putting them next to a testimonial, a staff bio, or a product claim would
 * imply endorsement, which is a personality-rights problem in every EU
 * jurisdiction and misleading advertising on top. No face on this site is
 * ever presented as a customer or an employee of this bank. If you want
 * people who look like customers, buy model-released stock.
 */
export interface Face {
  /** Wikipedia article title — the resolver key. */
  title: string;
  name: string;
  role: string;
  /** TapeItem id this face is attached to. */
  story: string;
}

export const FACE_ROSTER: Face[] = [
  { title: "Christine Lagarde", name: "Christine Lagarde", role: "President, European Central Bank", story: "ecb-hold" },
  { title: "Boris Vujčić", name: "Boris Vujčić", role: "Vice-President, ECB", story: "hike" },
  { title: "Piero Cipollone", name: "Piero Cipollone", role: "ECB Executive Board — digital euro", story: "deuro" },
  { title: "Isabel Schnabel", name: "Isabel Schnabel", role: "ECB Executive Board — market operations", story: "energy" },
  { title: "Philip R. Lane", name: "Philip R. Lane", role: "Chief Economist, ECB", story: "hicp" },
  { title: "Frank Elderson", name: "Frank Elderson", role: "ECB Executive Board — supervision", story: "fraud" },
  { title: "Claudia Buch", name: "Claudia Buch", role: "Chair of the Supervisory Board, ECB", story: "mica" },
  { title: "Joachim Nagel", name: "Joachim Nagel", role: "President, Deutsche Bundesbank", story: "wages" },
  { title: "Valdis Dombrovskis", name: "Valdis Dombrovskis", role: "European Commission — economy", story: "trilogue" },
  { title: "Dimitar Radev", name: "Dimitar Radev", role: "Governor, Bulgarian National Bank", story: "bulgaria" },
  { title: "Luis de Guindos", name: "Luis de Guindos", role: "Vice-President of the ECB, 2018–2026", story: "spread" },
];

/** story id → face, for the card renderer. */
export const FACE_BY_STORY: Record<string, Face> = Object.fromEntries(
  FACE_ROSTER.map((f) => [f.story, f])
);
