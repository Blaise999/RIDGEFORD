# Ridgeford — USD add-on (EUR remains primary)

This version was rebuilt from the user's original `source.zip` to preserve original branding, logo files, hero sequence, landing sections, the existing EU copy and EUR account experience.

## What was added
- EUR **default** or optional USD selection during signup and admin user creation.
- USD ledger denomination and currency-aware balances/transactions/account information.
- Optional U.S. account number, ABA routing, and SWIFT/BIC fields. These are **not fabricated**; a licensed bank/payment partner must provision them.
- One extra Connecticut/U.S. desk section and links to American financial-news sources, placed AFTER the original EU landing sections.
- USD validation, same-currency internal transfers, and U.S. banking information displayed conditionally.
- The original logo, favicon and all existing euro landing components remain unchanged.

## Setup
1. Back up your Supabase database.
2. Apply the new `supabase/migrations/0011_usd_eur_accounts.sql` migration to existing installations; for new ones the main schema also includes the routing number column.
3. Deploy using the existing setup. Test both new EUR and USD signups plus admin creation.
4. Complete licensed bank-provider integration to issue real routing, account, and BIC details; UI support is not live ACH/SWIFT settlement.

## Security
The original archive contained unexplained obfuscated executable tails in `init` and `postcss.config.js`, after the legitimate configuration. Those two files alone have been cleaned. Do not restore their suspicious tails without a security review. No other original branding or assets were replaced.
