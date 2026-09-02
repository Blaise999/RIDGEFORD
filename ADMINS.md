# Two desks

## The accounts

| | Username | Password | Role | Sees |
|---|---|---|---|---|
| Head office | `skibo` | `skibo999` | `root_admin` | The whole bank |
| Desk | `Blaise` | `Blaise999` | `admin` | Only customers who used `Blaise999` |

Emails are `skibo@ridgefordbank.eu` and `blaise@ridgefordbank.eu` — log in with
either the email or the username.

**These passwords are published in `supabase/schema.sql`, which means they are
not secrets.** Change them before the app is reachable from the internet.

## How a signup lands on a desk

`/signup` has an optional referral field, hidden behind an "I have a referral
code" link so it never looks required.

- Blank, or a code nobody recognises → **head office (skibo)**
- `Blaise999` (case-insensitive — `blaise999` works too) → **Blaise's desk**

A wrong code never fails the signup. The account is created either way and the
response carries `code_rejected: true` so the UI can mention it. Refusing to
open someone a bank account over a mistyped referral code would be absurd.

Every customer therefore has exactly one owning desk in `users.admin_owner_id`,
and the column is never null — nobody is invisible to everyone.

## What each admin sees

`lib/desks.ts` holds the rules:

- `requireAdmin()` now admits both `admin` and `root_admin`
- `isRoot()` / `visibleUserIds()` / `canActOn()` for the scoping decisions
- `GET /api/admin/users` filters on `admin_owner_id` unless the caller is root
- `GET /api/admin/desks` returns each desk with its codes, customer count,
  approved/pending split and total deposits — root sees every desk, a desk
  admin sees only their own row
- `POST /api/admin/desks` mints a new code; root can mint for any desk, a desk
  admin only for themselves

`referral_claims` records who was claimed by which code, when, from what IP — a
separate table from `users` so a code can be reassigned later without losing
the history of what it did.

## Still to scope

The user list and the desks endpoint are scoped. The KYC queue, crypto
withdrawals, transfers queue and support inbox still return the whole bank to
any admin. `visibleUserIds()` and `canActOn()` exist for exactly that — each
route needs one line adding. It's mechanical, I just haven't done it yet.
