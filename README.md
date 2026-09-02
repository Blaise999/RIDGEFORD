# Ridgeford Capital Bank — Neobank app (Next.js + Supabase)

A blue / white / black neobank built with **Next.js 14 (App Router)**, **Supabase** (PostgreSQL), **Tailwind**, **Framer Motion** + **Lenis**, and **Resend**.

Highlights:

- **Revolut-style hero** — pinned scroll, layered parallax, edge-expand white reveal, 3 staggered glass cards, phone mockup with mouse tilt, floating currency blobs.
- **Chameleon navbar** — swaps its text / background tint per section via `IntersectionObserver`.
- **Professional fintech dashboard** — Checking / Savings toggle, gradient balance hero, 30-day spending chart (interactive bars), top-categories breakdown, pending transfers, recent activity, hide-balance toggle, mobile-first layout.
- **Transfers** — SEPA, SEPA Instant, Internal (Ridgeford Capital Bank → Ridgeford Capital Bank), International SWIFT. Each transfer is submitted for admin review, admin approves/rejects, balances move, ledger rows post, emails fire, in-app notifications fire.
- **Notifications** — live bell in the topbar, unread counter, 30-second polling, mark-all-read.
- **Admin powers** — block / unblock users, approve / reject transfers, **edit any balance** (checking or savings; set / credit / debit with optional ledger row), **seed random transactions** with full control (direction, count up to 2000, amount range, date range across multiple years, account, optional balance roll-forward), **inject a single transaction** at any backdated date with real merchants / categories / ledger + balance effect.

## Stack

| Area | Tech |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind + custom tokens |
| Motion | Framer Motion + Lenis |
| Database | Supabase (PostgreSQL) |
| Auth | Bcrypt + JWT cookie (HTTP-only) |
| Emails | Resend (with stdout fallback in dev) |
| Icons | lucide-react |
| Images | Unsplash via `next/image` |

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, run it.
   The file creates all tables (users, spaces, transfers, transactions, notifications, admin_actions), triggers, indexes, row-level security, and seeds a demo admin.
3. **Settings → API**, copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Env vars

Copy `.env.example` to `.env.local`:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

JWT_SECRET=change-me-to-a-long-random-string

# Leave blank in dev to log emails to stdout
RESEND_API_KEY=
MAIL_FROM="Ridgeford Capital Bank <noreply@ridgefordbank.eu>"

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a JWT secret with `openssl rand -hex 32`.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

## Accounts

### Demo admin (seeded by the SQL)

| Email | Password |
| --- | --- |
| `admin@ridgefordbank.eu` | `Admin123!` |

Admins log in at **`/admin-login`** and land on **`/admin`**.

> After your first login, change the password immediately in SQL:
> ```sql
> update public.users
> set password_hash = '<new bcrypt hash from bcryptjs>'
> where email = 'admin@ridgefordbank.eu';
> ```

### How users are created

Users sign up at **`/signup`**. The signup route:

1. Validates email + password (≥ 8 chars).
2. Hashes the password with bcrypt.
3. Generates a German-style IBAN + 4-digit demo card number.
4. Inserts a row in `public.users` with `role = 'user'` and starting balances (checking 2,500 € + savings 1,200 €).
5. Seeds **28 realistic transactions** over the last 30 days so the dashboard has immediate life.
6. Writes "welcome" + "welcome credit" in-app notifications.
7. Sends a welcome email via Resend (or logs to stdout if no API key).
8. Signs a JWT, sets the session cookie, returns the user.

So new users show up in `public.users` automatically — no extra Supabase Auth plumbing required.

### Promoting an existing user to admin

Run this in the Supabase SQL editor:

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

They can then log in at `/admin-login` (the `/login` page will refuse admin roles on purpose).

## Admin powers

All of these live on **`/admin/users/:id`**:

### Block / unblock

Pops a reason prompt, calls `POST /api/admin/users/:id/block`, flips the `blocked` flag, writes an admin-action audit row, sends an email, and fires an in-app notification. Blocked users cannot submit transfers and see a red banner on their dashboard.

### Edit balance

For either **Checking** or **Savings**, pick a mode:

- **Set to X** — force the balance to exactly X
- **Credit +X** — add X
- **Debit −X** — subtract X (floored at 0)

Optionally post a ledger row for the delta, tagged as an `adjustment`. Always sends an `admin_adjustment` notification to the user.

### Seed random transactions

Open the "Seed" modal:

- **Direction** — `both`, `sent` (debits only), `received` (credits only)
- **Count** — 1–2,000
- **Amount range** — arbitrary EUR min/max
- **Date range** — any two dates. Go as wide as you like — 3, 4, 5 years back.
- **Account** — checking or savings
- **Adjust balance** — optional; when on, the user's balance moves by the net of the seeded transactions.

Uses a large merchant pool: **~180 real European companies** across groceries, dining, transport, shopping, subscriptions, bills, housing, travel, entertainment, and health. Incoming credits are attributed to **~150 random first × last name combinations** (yielding ~22,500 unique full names) or random salary payers.

### Inject a single transaction

Open the "Inject" modal. Pick direction, account, amount, date (any past date), merchant/sender, category, description. Optionally move the balance. The transaction lands on the ledger at the exact date you chose — so it shows up in the user's chart bar for that day, in their recent activity, and in a fresh notification.

## User flow

1. **Sign up** at `/signup` → welcome notification + 30 days of seeded activity appear immediately.
2. **Dashboard** at `/dashboard`:
   - Switch between Checking / Savings at the top.
   - See the balance hero, spending chart, category breakdown, KPIs, pending transfers, recent activity.
   - Hit the bell in the top bar for live notifications.
3. **Send money** at `/dashboard/transfer`:
   - **SEPA Instant** — arrives in ~10 seconds (after approval).
   - **SEPA** — next working day.
   - **Internal** — to another Ridgeford Capital Bank user by email.
   - **International (SWIFT)** — worldwide, 20+ currencies, 1–3 business days.
4. Every transfer writes a `pending_admin` status and fires a "submitted" notification + email.
5. Admin approves → balance moves, ledger rows post, recipient is credited on internal rail, both parties get notifications + emails.

## Project layout

```
src/
  app/
    (auth)/              login, signup, admin-login
    admin/               dark admin console
    dashboard/           user dashboard (mobile-first)
    api/                 all API routes
  components/
    landing/             Hero + Navbar + all sections
    dashboard/           Sidebar, Topbar, charts, switcher, bell
    admin/               Sidebar + Topbar
  lib/
    auth.ts              bcrypt + JWT cookie
    email/               Resend + HTML templates
    notify.ts            in-app notifications helper
    seed.ts              huge merchant + name pool + generator
    supabase/admin.ts    service-role client
    utils.ts             fmtMoney, maskIban, genReference, …
supabase/
  schema.sql             drop-in SQL
```

## License

UNLICENSED — private project.
