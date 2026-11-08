# International Transfers — country-guided FX requests

**Existing Ridgeford logo, European branding and scroll-motion assets are unchanged.** This feature is additive inside the existing dashboard International Transfers page.

## What is included

- Country picker with destinations including France, Italy, Germany, Spain, Netherlands, UK, Switzerland, USA, Canada, Australia, Japan, UAE and Nigeria.
- Country-specific wire-detail guidance and fields (IBAN or local account number, SWIFT/BIC, bank name and local code when needed).
- For a USD account, the sending amount is in USD; for an EUR account, it is in EUR. The destination currency is selected based on the receiving country.
- A conversion preview from Frankfurter's published daily **reference** exchange rates. Preview requests fail closed if the rate is absent or stale; there is no invented 1:1 rate.
- An authenticated server-side quote, expiring after five minutes. The transfer records the source amount/currency, target amount/currency and exact reference rate/date.
- Existing OTP and transfer request flow. New FX requests appear in history, notifications, and the admin queue with **both** currencies and pending/reviewed status.

## Database

Apply `supabase/migrations/0014_international_fx_requests.sql` after the previous migrations (0011 and 0012). Back up the database first. This migration **does not alter existing balances, users or historic transfer amounts**.

If an earlier 0013 demo-data SQL file was used, this 0014 migration remains independent of that optional dataset.

## Settlement limitation (important)

A free daily *reference exchange rate* is not a tradable rate and does not execute an FX conversion or international bank wire. This build correctly keeps new FX requests **pending settlement** after admin approval and does not debit money, send receipts claiming payment, or mark such transfers completed. A licensed bank/FX payout provider must be integrated before production disbursement and final settlement postings can be implemented.

The old non-FX transfer routes remain present. Existing internal transfer approvals use their prior implementation.

## Git LFS

This package retains the original `.gitattributes` and all existing animation files. If the ZIP contains LFS pointer text for `.webp` assets, do not overwrite real WebP objects already present in GitHub. Restore them with `git lfs pull` in a fresh clone and copy the source while excluding `*.webp`.

## QA checklist

1. As a USD account, select France, enter 1,000 USD and check the EUR estimate, rate date, and expiry notice.
2. Select Italy and verify Italian IBAN validation; select USA and verify account + ABA + SWIFT inputs.
3. Enter an invalid IBAN or bank routing code and confirm rejection before a transfer is saved.
4. Complete OTP: check the transfer, pending transaction row, and notification display both currencies.
5. Admin > Transfers: inspect the source/destination quote; approve for processing and verify the transfer is **not** marked settled or debited.
6. Reject a test request; confirm history and notifications reflect rejection.
7. Check the original scroll-motion sequence with the real Git LFS WebP frames.
