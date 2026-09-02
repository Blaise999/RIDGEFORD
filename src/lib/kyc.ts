/**
 * European CDD (customer due diligence) model.
 *
 * The shape of this file follows what an EU credit institution is actually
 * required to collect and keep: AMLD5/6 + the EBA ML/TF risk-factor
 * guidelines for identification and ongoing monitoring, DAC2/CRS and FATCA
 * for tax self-certification, GDPR Art. 6/7 for the consent record, and
 * eIDAS for the simple electronic signature.
 *
 * Pure data + pure functions — safe to import from client components.
 */

export const KYC_STEPS = [
  { key: "identity", title: "Identity", blurb: "Your legal name, as printed on your ID" },
  { key: "address", title: "Residence", blurb: "Where you legally live" },
  { key: "tax", title: "Tax residency", blurb: "CRS & FATCA self-certification" },
  { key: "financial", title: "Finances", blurb: "Income, source of funds and wealth" },
  { key: "activity", title: "Account activity", blurb: "How you plan to use the account" },
  { key: "declarations", title: "Declarations", blurb: "PEP, sanctions and beneficial ownership" },
  { key: "documents", title: "Documents", blurb: "ID, selfie and proof of address" },
  { key: "review", title: "Sign & submit", blurb: "Check everything, then sign" },
] as const;

export type KycStepKey = (typeof KYC_STEPS)[number]["key"];

/** EEA + the rest of Europe, then the common non-EEA residences. */
export const COUNTRIES: { code: string; name: string; eea?: boolean }[] = [
  { code: "AT", name: "Austria", eea: true },
  { code: "BE", name: "Belgium", eea: true },
  { code: "BG", name: "Bulgaria", eea: true },
  { code: "HR", name: "Croatia", eea: true },
  { code: "CY", name: "Cyprus", eea: true },
  { code: "CZ", name: "Czechia", eea: true },
  { code: "DK", name: "Denmark", eea: true },
  { code: "EE", name: "Estonia", eea: true },
  { code: "FI", name: "Finland", eea: true },
  { code: "FR", name: "France", eea: true },
  { code: "DE", name: "Germany", eea: true },
  { code: "GR", name: "Greece", eea: true },
  { code: "HU", name: "Hungary", eea: true },
  { code: "IS", name: "Iceland", eea: true },
  { code: "IE", name: "Ireland", eea: true },
  { code: "IT", name: "Italy", eea: true },
  { code: "LV", name: "Latvia", eea: true },
  { code: "LI", name: "Liechtenstein", eea: true },
  { code: "LT", name: "Lithuania", eea: true },
  { code: "LU", name: "Luxembourg", eea: true },
  { code: "MT", name: "Malta", eea: true },
  { code: "NL", name: "Netherlands", eea: true },
  { code: "NO", name: "Norway", eea: true },
  { code: "PL", name: "Poland", eea: true },
  { code: "PT", name: "Portugal", eea: true },
  { code: "RO", name: "Romania", eea: true },
  { code: "SK", name: "Slovakia", eea: true },
  { code: "SI", name: "Slovenia", eea: true },
  { code: "ES", name: "Spain", eea: true },
  { code: "SE", name: "Sweden", eea: true },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "AL", name: "Albania" },
  { code: "AD", name: "Andorra" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "MC", name: "Monaco" },
  { code: "ME", name: "Montenegro" },
  { code: "MK", name: "North Macedonia" },
  { code: "RS", name: "Serbia" },
  { code: "TR", name: "Türkiye" },
  { code: "UA", name: "Ukraine" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "CN", name: "China" },
  { code: "OTHER", name: "Other" },
];

export function countryName(code?: string | null) {
  if (!code) return "—";
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

/**
 * Residence in these jurisdictions cannot be onboarded remotely.
 * FATF "call for action" list plus comprehensively sanctioned territories.
 */
export const BLOCKED_COUNTRIES = ["KP", "IR", "SY", "CU", "RU", "BY", "MM", "AF"];

/** FATF "increased monitoring" — allowed, but scored as higher risk. */
export const HIGH_RISK_COUNTRIES = [
  "AL", "BB", "BF", "CM", "CD", "HR", "GI", "HT", "JM", "ML", "MZ", "NG",
  "PH", "SN", "SS", "SY", "TZ", "TR", "UG", "AE", "VN", "YE",
];

export const TITLES = ["Mr", "Ms", "Mx", "Dr", "Prof"];
export const GENDERS = [
  { v: "female", l: "Female" },
  { v: "male", l: "Male" },
  { v: "diverse", l: "Diverse" },
  { v: "undisclosed", l: "Prefer not to say" },
];

export const EMPLOYMENT_STATUS = [
  { v: "employed", l: "Employed" },
  { v: "self_employed", l: "Self-employed / freelance" },
  { v: "business_owner", l: "Business owner / director" },
  { v: "student", l: "Student" },
  { v: "retired", l: "Retired" },
  { v: "unemployed", l: "Not currently working" },
  { v: "homemaker", l: "Homemaker" },
];

export const INDUSTRIES = [
  "Accounting & audit", "Agriculture", "Architecture & construction", "Arts & entertainment",
  "Automotive", "Aviation & shipping", "Banking & finance", "Cash-intensive retail",
  "Charity & non-profit", "Consulting", "Crypto & digital assets", "Defence & arms",
  "Education", "Energy & mining", "Gambling & betting", "Government & public sector",
  "Healthcare & pharma", "Hospitality & tourism", "Insurance", "Legal services",
  "Logistics & transport", "Manufacturing", "Marketing & media", "Precious metals & stones",
  "Real estate", "Software & IT", "Sports", "Telecoms", "Other",
];

export const INCOME_BANDS = [
  { v: "lt_15k", l: "Under 15,000 € a year" },
  { v: "15_30k", l: "15,000 – 30,000 €" },
  { v: "30_60k", l: "30,000 – 60,000 €" },
  { v: "60_100k", l: "60,000 – 100,000 €" },
  { v: "100_250k", l: "100,000 – 250,000 €" },
  { v: "gt_250k", l: "Over 250,000 €" },
];

export const NET_WORTH_BANDS = [
  { v: "lt_50k", l: "Under 50,000 €" },
  { v: "50_250k", l: "50,000 – 250,000 €" },
  { v: "250k_1m", l: "250,000 – 1,000.000 €" },
  { v: "1_5m", l: "1 – 5 Mio €" },
  { v: "gt_5m", l: "Over 5 Mio €" },
];

export const SOURCE_OF_FUNDS = [
  { v: "salary", l: "Salary or wages" },
  { v: "business_income", l: "Business income / dividends" },
  { v: "self_employment", l: "Self-employment income" },
  { v: "savings", l: "Accumulated savings" },
  { v: "investments", l: "Investment returns" },
  { v: "property_sale", l: "Sale of property" },
  { v: "company_sale", l: "Sale of a company or shares" },
  { v: "inheritance", l: "Inheritance or gift" },
  { v: "pension", l: "Pension" },
  { v: "crypto", l: "Digital asset gains" },
  { v: "loan", l: "Loan or credit facility" },
  { v: "other", l: "Other" },
];

export const ACCOUNT_PURPOSE = [
  { v: "everyday", l: "Everyday banking" },
  { v: "salary", l: "Receiving salary" },
  { v: "savings", l: "Saving" },
  { v: "investing", l: "Investing & digital assets" },
  { v: "international", l: "International transfers" },
  { v: "business", l: "Business or freelance income" },
  { v: "property", l: "Property purchase" },
];

export const TURNOVER_BANDS = [
  { v: "lt_1k", l: "Under 1,000 € a month" },
  { v: "1_5k", l: "1,000 – 5,000 €" },
  { v: "5_15k", l: "5,000 – 15,000 €" },
  { v: "15_50k", l: "15,000 – 50,000 €" },
  { v: "gt_50k", l: "Over 50,000 €" },
];

export const CRYPTO_EXPERIENCE = [
  { v: "none", l: "None — this would be my first" },
  { v: "beginner", l: "Some — I've bought a few times" },
  { v: "regular", l: "Regular — I trade monthly" },
  { v: "professional", l: "Professional / institutional" },
];

/**
 * Every euro country calls its tax number something different, and telling a
 * customer in Lisbon to enter their "Steuer-Identifikationsnummer" is how you
 * lose them. The label follows their declared tax residence.
 */
export const TIN_LABELS: Record<string, { name: string; hint: string }> = {
  AT: { name: "Steuernummer / ATIN", hint: "Nine digits, from your Finanzamt notice." },
  BE: { name: "Rijksregisternummer / NN", hint: "Eleven digits, on your eID card." },
  BG: { name: "ЕГН (EGN)", hint: "Ten-digit uniform civil number." },
  HR: { name: "OIB", hint: "Eleven-digit personal identification number." },
  CY: { name: "Tax Identification Code", hint: "Eight digits and a letter." },
  EE: { name: "Isikukood", hint: "Eleven-digit personal identification code." },
  FI: { name: "Henkilötunnus", hint: "Six digits, a century marker, then four characters." },
  FR: { name: "Numéro fiscal (SPI)", hint: "Thirteen digits, top-left of your avis d'impôt." },
  DE: { name: "Steuer-Identifikationsnummer", hint: "Eleven digits, issued by the BZSt." },
  GR: { name: "ΑΦΜ (AFM)", hint: "Nine-digit tax registry number." },
  IE: { name: "PPS Number", hint: "Seven digits and one or two letters." },
  IT: { name: "Codice fiscale", hint: "Sixteen characters, letters and digits." },
  LV: { name: "Personas kods", hint: "Eleven digits." },
  LT: { name: "Asmens kodas", hint: "Eleven digits." },
  LU: { name: "Numéro d'identification national", hint: "Thirteen digits." },
  MT: { name: "Income Tax Number", hint: "Seven digits and a letter, or your ID card number." },
  NL: { name: "BSN", hint: "Nine-digit citizen service number." },
  PT: { name: "NIF", hint: "Nine digits." },
  SK: { name: "Rodné číslo / DIČ", hint: "Ten digits." },
  SI: { name: "Davčna številka", hint: "Eight digits." },
  ES: { name: "NIF / NIE", hint: "Eight digits and a letter, or X/Y/Z plus seven digits and a letter." },
};

export function tinLabel(country?: string | null) {
  const hit = country ? TIN_LABELS[country.toUpperCase()] : undefined;
  return hit || {
    name: "Tax identification number (TIN)",
    hint: "As issued by the tax authority where you are resident.",
  };
}

export const ID_DOCUMENT_TYPES = [
  { v: "passport", l: "Passport" },
  { v: "national_id", l: "National ID card" },
  { v: "residence_permit", l: "Residence permit" },
  { v: "drivers_licence", l: "Driving licence" },
];

export const DOCUMENT_KINDS = [
  {
    kind: "id_front",
    label: "Photo ID — front",
    hint: "All four corners visible, no glare, colour photo or scan.",
    required: true,
  },
  {
    kind: "id_back",
    label: "Photo ID — back",
    hint: "Not needed for a passport photo page.",
    required: false,
  },
  {
    kind: "selfie",
    label: "Selfie holding your ID",
    hint: "Your face and the document must both be readable. Used for liveness matching.",
    required: true,
  },
  {
    kind: "proof_of_address",
    label: "Proof of address",
    hint: "Utility bill, bank statement, or registration certificate dated in the last 3 months.",
    required: true,
  },
  {
    kind: "source_of_funds",
    label: "Source of funds evidence",
    hint: "Payslip, tax return, or sale contract. Required over 100,000 € expected turnover.",
    required: false,
  },
] as const;

// ── validation ──────────────────────────────────────────────────────────────

export type KycDraft = Record<string, any>;

/** Returns a map of field → message for the given step. Empty means valid. */
export function validateStep(step: KycStepKey, d: KycDraft): Record<string, string> {
  const e: Record<string, string> = {};
  const req = (k: string, msg: string) => {
    const v = d[k];
    if (v === undefined || v === null || String(v).trim() === "") e[k] = msg;
  };

  if (step === "identity") {
    req("legal_first_name", "Enter your first name exactly as on your ID");
    req("legal_last_name", "Enter your last name exactly as on your ID");
    req("date_of_birth", "Date of birth is required");
    req("place_of_birth", "Place of birth is required");
    req("country_of_birth", "Country of birth is required");
    req("nationality", "Nationality is required");
    req("phone", "A mobile number is required for strong customer authentication");
    if (d.date_of_birth) {
      const age = yearsSince(d.date_of_birth);
      if (Number.isNaN(age)) e.date_of_birth = "Enter a valid date";
      else if (age < 18) e.date_of_birth = "You must be at least 18 to open an account";
      else if (age > 120) e.date_of_birth = "Enter a valid date of birth";
    }
    if (d.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(String(d.phone))) {
      e.phone = "Enter a valid phone number, including the country code";
    }
  }

  if (step === "address") {
    req("residence_country", "Country of residence is required");
    req("street", "Street is required");
    req("street_number", "House number is required");
    req("postal_code", "Postal code is required");
    req("city", "City is required");
    req("resident_since", "Tell us when you moved to this address");
    if (d.residence_country && BLOCKED_COUNTRIES.includes(d.residence_country)) {
      e.residence_country = "We're not able to onboard customers resident in this country.";
    }
  }

  if (step === "tax") {
    req("tax_residence_country", "Country of tax residence is required");
    if (!d.tax_id && !d.tin_unavailable_reason) {
      e.tax_id = "Enter your tax identification number, or tell us why you don't have one";
    }
    if (d.second_tax_residence && !d.second_tax_id && !d.tin_unavailable_reason) {
      e.second_tax_id = "Enter the TIN for your second tax residence";
    }
    if (d.us_person === true && !d.us_tin) {
      e.us_tin = "US persons must supply a TIN / SSN under FATCA";
    }
    if (d.us_person === undefined || d.us_person === null) {
      e.us_person = "Answer the FATCA question";
    }
  }

  if (step === "financial") {
    req("employment_status", "Employment status is required");
    req("annual_income_band", "Select your income band");
    req("net_worth_band", "Select your estimated net worth");
    req("source_of_wealth", "Describe how your overall wealth was built");
    if (!Array.isArray(d.source_of_funds) || d.source_of_funds.length === 0) {
      e.source_of_funds = "Select at least one source of funds";
    }
    if (["employed", "self_employed", "business_owner"].includes(d.employment_status)) {
      req("occupation", "Job title is required");
      req("industry", "Industry is required");
      if (d.employment_status === "employed") req("employer_name", "Employer name is required");
    }
    if (d.source_of_wealth && String(d.source_of_wealth).trim().length < 20) {
      e.source_of_wealth = "Please give a little more detail (at least a sentence)";
    }
  }

  if (step === "activity") {
    req("expected_monthly_inflow", "Select your expected incoming volume");
    req("expected_monthly_outflow", "Select your expected outgoing volume");
    req("crypto_experience", "Tell us about your digital-asset experience");
    if (!Array.isArray(d.account_purpose) || d.account_purpose.length === 0) {
      e.account_purpose = "Select what you'll use the account for";
    }
  }

  if (step === "declarations") {
    if (d.is_pep === undefined || d.is_pep === null) e.is_pep = "Answer the PEP question";
    if (d.is_pep === true) {
      req("pep_role", "Describe the public function held");
      req("pep_country", "Select the country");
    }
    if (d.associate_pep === true && !d.associate_pep_detail) {
      e.associate_pep_detail = "Tell us the relationship and the function held";
    }
    if (d.acting_own_behalf === false && !d.third_party_detail) {
      e.third_party_detail = "Identify the person you're acting for";
    }
    if (!d.sanctions_declaration) e.sanctions_declaration = "This declaration is required";
    if (!d.criminal_declaration) e.criminal_declaration = "This declaration is required";
  }

  if (step === "documents") {
    req("id_document_type", "Select a document type");
    req("id_document_number", "Document number is required");
    req("id_issuing_country", "Issuing country is required");
    req("id_expiry_date", "Expiry date is required");
    if (d.id_expiry_date && new Date(d.id_expiry_date).getTime() < Date.now()) {
      e.id_expiry_date = "That document has expired — use a valid one";
    }
    const kinds: string[] = d.__uploaded || [];
    for (const doc of DOCUMENT_KINDS) {
      if (doc.required && !kinds.includes(doc.kind)) {
        e[doc.kind] = `${doc.label} is required`;
      }
    }
  }

  if (step === "review") {
    if (!d.consent_terms) e.consent_terms = "Required";
    if (!d.consent_privacy) e.consent_privacy = "Required";
    if (!d.consent_crs_fatca) e.consent_crs_fatca = "Required";
    if (!d.consent_esign) e.consent_esign = "Required";
    const check = checkSignature(d);
    if (check) e.signature_name = check;
  }

  return e;
}

/**
 * Normalise a name for comparison.
 *
 * Strips diacritics, punctuation (so "Dr." and "O'Brien" behave), and collapses
 * every kind of whitespace — including the non-breaking space that iOS and
 * several Android keyboards insert after autocomplete. Without this, a name
 * that looks identical on screen fails an equality test and the customer is
 * told their own name is wrong, which is maddening.
 */
function normalizeName(v: unknown): string[] {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // combining accents
    .replace(/[\u00a0\u2007\u202f]/g, " ") // non-breaking spaces
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")        // punctuation, hyphens, apostrophes
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Validate the typed electronic signature against the declared legal name.
 *
 * Deliberately forgiving about *form* and strict about *substance*: the
 * signature must contain the first and last name and may not contain any name
 * the customer never declared. Middle names are optional — people sign with
 * them or without them, and both are their real signature.
 *
 * Returns an error message, or null when the signature is acceptable.
 */
export function checkSignature(d: KycDraft): string | null {
  const first = normalizeName(d.legal_first_name);
  const last = normalizeName(d.legal_last_name);
  const middle = normalizeName(d.legal_middle_name);
  const signed = normalizeName(d.signature_name);

  if (!signed.length) return "Type your full legal name to sign";
  if (!first.length || !last.length) {
    return "Add your legal name in step 1 before signing";
  }

  const expected = [...first, ...last].join(" ");
  const allowed = new Set([...first, ...middle, ...last]);

  const hasFirst = first.every((t) => signed.includes(t));
  const hasLast = last.every((t) => signed.includes(t));
  const noStrangers = signed.every((t) => allowed.has(t));

  if (hasFirst && hasLast && noStrangers) return null;

  // Say what we are actually expecting rather than "does not match".
  const shown = `${String(d.legal_first_name || "").trim()} ${String(d.legal_last_name || "").trim()}`.trim();
  if (!hasFirst || !hasLast) {
    return `Sign with your full legal name — type "${shown || expected}"`;
  }
  return `That includes a name you haven't declared. Type "${shown || expected}"`;
}

export function yearsSince(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return NaN;
  const diff = Date.now() - d.getTime();
  return diff / (365.25 * 86400000);
}

// ── risk scoring ────────────────────────────────────────────────────────────

export type RiskAssessment = {
  score: number;
  rating: "low" | "medium" | "high";
  factors: { label: string; points: number }[];
};

/**
 * A simplified, transparent version of the customer risk assessment an EU
 * bank runs at onboarding. Compliance still decides — this only sorts the
 * queue and tells the reviewer what to look at first.
 */
export function assessRisk(d: KycDraft): RiskAssessment {
  const factors: { label: string; points: number }[] = [];
  const add = (label: string, points: number) => factors.push({ label, points });

  if (d.is_pep) add("Politically exposed person", 40);
  else if (d.associate_pep) add("Family member / close associate of a PEP", 25);

  if (d.residence_country && BLOCKED_COUNTRIES.includes(d.residence_country)) {
    add("Residence in a prohibited jurisdiction", 100);
  } else if (d.residence_country && HIGH_RISK_COUNTRIES.includes(d.residence_country)) {
    add("Residence in a FATF increased-monitoring jurisdiction", 20);
  }

  if (d.nationality && HIGH_RISK_COUNTRIES.includes(d.nationality)) {
    add("Nationality of a higher-risk jurisdiction", 8);
  }
  if (d.tax_residence_country && d.residence_country && d.tax_residence_country !== d.residence_country) {
    add("Tax residence differs from country of residence", 8);
  }
  if (d.second_tax_residence) add("Multiple tax residences", 6);
  if (d.us_person) add("US person (FATCA reporting)", 10);

  const countries: string[] = Array.isArray(d.expected_countries) ? d.expected_countries : [];
  const flagged = countries.filter((c) => HIGH_RISK_COUNTRIES.includes(c) || BLOCKED_COUNTRIES.includes(c));
  if (flagged.length) add(`Expected transactions with ${flagged.length} higher-risk country(s)`, 12 * flagged.length);

  if (d.industry && ["Crypto & digital assets", "Gambling & betting", "Cash-intensive retail", "Precious metals & stones", "Defence & arms"].includes(d.industry)) {
    add(`Higher-risk sector: ${d.industry}`, 15);
  }

  if (!d.acting_own_behalf) add("Acting on behalf of a third party", 20);

  const sof: string[] = Array.isArray(d.source_of_funds) ? d.source_of_funds : [];
  if (sof.includes("crypto")) add("Source of funds includes digital assets", 10);
  if (sof.includes("inheritance") || sof.includes("company_sale")) add("Lump-sum source of funds", 6);
  if (sof.includes("loan")) add("Borrowed funds", 8);

  if (d.expected_monthly_inflow === "gt_50k") add("High expected monthly turnover", 15);
  else if (d.expected_monthly_inflow === "15_50k") add("Elevated expected monthly turnover", 8);

  if (d.net_worth_band === "gt_5m") add("High net worth", 8);
  if (d.crypto_experience === "professional") add("Professional digital-asset activity", 10);
  if (d.employment_status === "unemployed" && ["15_50k", "gt_50k"].includes(d.expected_monthly_inflow)) {
    add("Expected turnover inconsistent with stated employment", 25);
  }

  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  const rating: RiskAssessment["rating"] = score >= 55 ? "high" : score >= 25 ? "medium" : "low";
  return { score, rating, factors };
}

/** Fields the customer may write. Anything else in the payload is ignored. */
export const WRITABLE_FIELDS = [
  "title", "legal_first_name", "legal_middle_name", "legal_last_name", "birth_name",
  "date_of_birth", "gender", "place_of_birth", "country_of_birth", "nationality",
  "second_nationality", "phone",
  "residence_country", "street", "street_number", "address_extra", "postal_code",
  "city", "region", "resident_since", "previous_address",
  "tax_residence_country", "tax_id", "second_tax_residence", "second_tax_id",
  "tin_unavailable_reason", "us_person", "us_tin",
  "employment_status", "employer_name", "employer_country", "occupation", "industry",
  "annual_income_band", "net_worth_band", "source_of_funds", "source_of_funds_detail",
  "source_of_wealth", "expected_monthly_inflow", "expected_monthly_outflow",
  "expected_countries", "account_purpose", "crypto_experience", "expected_crypto_volume",
  "is_pep", "pep_role", "pep_country", "pep_since", "associate_pep", "associate_pep_detail",
  "acting_own_behalf", "third_party_detail", "sanctions_declaration", "criminal_declaration",
  "id_document_type", "id_document_number", "id_issuing_country", "id_issuing_authority",
  "id_issue_date", "id_expiry_date",
  "consent_terms", "consent_privacy", "consent_crs_fatca", "consent_credit_check",
  "consent_esign", "consent_marketing", "signature_name",
  "step",
] as const;
