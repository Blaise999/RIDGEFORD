# What changed for the euro area

The app was built German-first. It is now euro-area-first, with Germany as the
licensing jurisdiction rather than the assumed customer location.

## New: `src/lib/iban.ts`

A real SEPA IBAN layer, which the app previously did not have at all — the old
validation was `if (!beneficiary_iban) return fail(400, ...)`.

- Registry of **51 countries** with correct IBAN lengths, flagged `euro` /
  `sepa`, plus common non-SEPA destinations so we can explain *why* we're
  refusing rather than saying "invalid".
- **Real ISO 13616 mod-97 checksum validation.** Not a length check.
- `verifyIban()` returns errors in the order that produces the most useful
  message: too short → bad shape → unknown country → wrong length for that
  country → failed check digits → outside SEPA.
- `generateIban()` now computes genuine check digits, so every account number
  the bank issues passes a real IBAN validator. It was previously two random
  digits.
- `comparePayeeName()` — Verification of Payee matching, with legal-form
  suffixes (GmbH, SA, NV, BV, SRL, Oy, AB…) and diacritics normalised away, so
  "Société Générale SA" matches "Societe Generale".

## Transfers

`POST /api/transfers` now derives the beneficiary country from the IBAN,
validates it properly, and books an instant-eligible euro IBAN onto
`sepa_instant` automatically. Same price either way — Art. 5b IPR forbids
charging more for instant, so both are 0,00 €. SWIFT is 14,00 €.

New `POST /api/transfers/vop` runs the name check. It returns match /
close match / no match / not supported, and **warns rather than blocks** — which
is what the regulation actually says. A close or no match must be explicitly
acknowledged before the transfer is accepted; the server enforces that with a
409, so the client can't skip it.

`/dashboard/transfer/sepa` was rebuilt around this: country badge and rail
readout appear as you type, the name check fires 600 ms after you stop, and
non-euro SEPA countries get an explicit note that the beneficiary's bank
converts on arrival.

## Locale

`fmtMoneyIn(amount, country)` and `localeFor(country)` in `src/lib/utils.ts` map
all 21 members to the locale their customers actually read — 1.234,56 € in
Berlin and Madrid, 1 234,56 € in Paris, €1,234.56 in Dublin. `fmtMoney` still
defaults to German grouping for internal/admin surfaces.

## KYC

`tinLabel(country)` gives the right name and format hint for the tax number in
all 21 members — Codice fiscale in Italy, NIF in Portugal and Spain, PPS Number
in Ireland, ΑΦΜ in Greece, BSN in the Netherlands, and so on. The wizard was
previously hardcoded to "In Germany this is your 11-digit
Steuer-Identifikationsnummer".

## Statement data

`EURO_MERCHANTS` in `src/lib/seed.ts` adds ~58 real operators across the bloc —
Albert Heijn, Mercadona, Esselunga, Pingo Doce, SNCF, Renfe, Trenitalia, ÖBB,
Rimi, Maxima, Selver, Kaufland Bulgaria, plus pan-European names. Generated
statements now look like they belong to a euro-area customer instead of
exclusively a Berliner. The original German pool is kept and merged, not
replaced.

## Still German, correctly

The BIC (`RDGFDEFFXXX`), the licence (BaFin), the deposit scheme (EdB), and
customer IBANs (DE) — because that is where the bank is authorised. A German
credit institution issuing DE IBANs to customers across the euro area is exactly
how this works in practice.
