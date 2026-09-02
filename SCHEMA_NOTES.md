# What migration 0004 added

You were right that the SQL was thin. `supabase/schema.sql` is now the complete
single-paste file; `0004_admins_referrals_and_gaps.sql` is the same content as a
standalone migration if you've already run 0001–0003.

**Admin hierarchy** — `role` gains `root_admin`; users gain `admin_owner_id`,
`referral_code`, `referred_at`, `admin_label`, `username` (with a
case-insensitive unique index).

**Referrals** — `referral_codes` (code, owning admin, active flag, optional
`max_uses`, usage counter) and `referral_claims` (who, which code, when, IP,
user agent).

**The gaps that were genuinely missing:**

| Table | Why it matters |
|---|---|
| `sessions` | You could not see or revoke a customer's live logins. Signed cookies alone can't do that. |
| `login_events` | Successes *and* failures — the raw material of any fraud review. |
| `beneficiaries` | Saved payees, caching the last Verification of Payee answer so a repeat payment can say "you checked this name in March". |
| `standing_orders` | Payments you push. |
| `direct_debits` | Mandates others pull, with SEPA Creditor Identifier and core/B2B scheme. Genuinely a different thing from a standing order — most demo schemas wrongly merge them. |
| `cards` | Last four and a display token only. No PANs, ever. Freeze state, per-channel toggles, daily limit. |
| `statements` | One row per generated period, with opening/closing balances. |
| `fx_rates` | ECB daily reference rates, so an FX quote has a defensible basis instead of a made-up number. |
| `bank_settings` | Spread, SWIFT fee, FX margin, signup open/closed — changeable without a deploy. |

**Also fixed:** `admin_actions.target_type` never accepted the values 0003
started writing (`kyc_application`, `crypto_withdrawal`), so those audit inserts
were silently failing the check constraint. Added those plus the new ones.

**Indexes** on the paths the admin desk actually hits: transactions by user and
date, pending transactions, transfers by status, unread notifications, OTP
lookup by email+purpose.
