-- ============================================================================
-- Ridgeford Capital Bank — 0004
--
--   (a) Two-tier administration: a root admin who sees everything, and desk
--       admins who see only the customers referred through their own code.
--   (b) Referral codes, with an audit trail of who was claimed by whom.
--   (c) The things 0001–0003 left out: sessions, login history, beneficiaries,
--       standing orders, direct debits, cards, statements, FX rates, audit
--       coverage, and the indexes that stop the admin desk crawling.
--
-- Safe to re-run.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────────────────────
-- (a) ADMIN HIERARCHY
--
-- `role` gains 'root_admin'. A root admin is the bank; a desk admin is a book
-- of business inside it. Every customer belongs to exactly one desk, recorded
-- on users.admin_owner_id, and every admin query filters on it unless the
-- caller is root.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('user', 'admin', 'root_admin'));

alter table public.users add column if not exists admin_owner_id  uuid references public.users(id) on delete set null;
alter table public.users add column if not exists referral_code   text;
alter table public.users add column if not exists referred_at     timestamptz;
alter table public.users add column if not exists admin_label     text;
alter table public.users add column if not exists username        text;

create unique index if not exists users_username_key on public.users (lower(username)) where username is not null;
create index if not exists users_owner_idx    on public.users (admin_owner_id, created_at desc);
create index if not exists users_referral_idx on public.users (referral_code);

comment on column public.users.admin_owner_id is
  'The desk admin who controls this customer. Unreferred signups fall to the root admin.';

-- ────────────────────────────────────────────────────────────────────────────
-- (b) REFERRAL CODES
--
-- One row per code. Codes are matched case-insensitively but stored as typed,
-- so "blaise999" and "Blaise999" reach the same desk.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null,
  admin_id    uuid not null references public.users(id) on delete cascade,
  label       text,
  active      boolean not null default true,
  max_uses    integer,
  uses        integer not null default 0,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists referral_codes_code_key on public.referral_codes (lower(code));
create index if not exists referral_codes_admin_idx on public.referral_codes (admin_id, active);

drop trigger if exists ref_set_updated on public.referral_codes;
create trigger ref_set_updated before update on public.referral_codes
  for each row execute function public.set_updated_at();

-- Who was claimed, by which code, when. Kept separately from users so a code
-- can be reassigned later without losing the history of what it did.
create table if not exists public.referral_claims (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  code         text not null,
  admin_id     uuid not null references public.users(id) on delete cascade,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now(),
  unique (user_id)
);
create index if not exists referral_claims_admin_idx on public.referral_claims (admin_id, created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- (c) THE GAPS
-- ────────────────────────────────────────────────────────────────────────────

-- Sessions: so an admin can see and revoke a customer's live logins, which the
-- signed-cookie-only approach could not do.
create table if not exists public.sessions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  token_hash   text not null,
  ip_address   text,
  user_agent   text,
  device_label text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz,
  revoked_at   timestamptz,
  revoked_by   uuid references public.users(id)
);
create index if not exists sessions_user_idx on public.sessions (user_id, last_seen_at desc);
create index if not exists sessions_hash_idx on public.sessions (token_hash);

-- Login history, including failures — the raw material of any fraud review.
create table if not exists public.login_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  email       text,
  outcome     text not null check (outcome in
                ('success','bad_password','unknown_user','otp_sent','otp_failed','blocked','locked_out')),
  ip_address  text,
  user_agent  text,
  country     text,
  created_at  timestamptz not null default now()
);
create index if not exists login_events_user_idx  on public.login_events (user_id, created_at desc);
create index if not exists login_events_email_idx on public.login_events (lower(email), created_at desc);

-- Saved beneficiaries, with the last Verification of Payee answer cached so a
-- repeat payment can show "you checked this name in March".
create table if not exists public.beneficiaries (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  name           text not null,
  iban           text,
  bic            text,
  country        text,
  nickname       text,
  is_favourite   boolean not null default false,
  last_vop       text check (last_vop in ('match','close_match','no_match','not_supported')),
  last_vop_at    timestamptz,
  last_used_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, iban)
);
create index if not exists beneficiaries_user_idx on public.beneficiaries (user_id, last_used_at desc nulls last);

drop trigger if exists benef_set_updated on public.beneficiaries;
create trigger benef_set_updated before update on public.beneficiaries
  for each row execute function public.set_updated_at();

-- Standing orders (we push) and direct debit mandates (they pull). Two very
-- different things that most demo schemas wrongly collapse into one table.
create table if not exists public.standing_orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  beneficiary_id    uuid references public.beneficiaries(id) on delete set null,
  beneficiary_name  text not null,
  beneficiary_iban  text not null,
  amount            numeric(18,2) not null check (amount > 0),
  currency          text not null default 'EUR',
  reference         text,
  frequency         text not null check (frequency in ('weekly','biweekly','monthly','quarterly','yearly')),
  next_run          date not null,
  last_run          date,
  end_date          date,
  account_type      text not null default 'checking' check (account_type in ('checking','savings')),
  status            text not null default 'active' check (status in ('active','paused','ended')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists so_user_idx on public.standing_orders (user_id, status);
create index if not exists so_due_idx  on public.standing_orders (next_run) where status = 'active';

drop trigger if exists so_set_updated on public.standing_orders;
create trigger so_set_updated before update on public.standing_orders
  for each row execute function public.set_updated_at();

create table if not exists public.direct_debits (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  creditor_name  text not null,
  creditor_id    text,                       -- SEPA Creditor Identifier
  mandate_ref    text not null,
  scheme         text not null default 'core' check (scheme in ('core','b2b')),
  status         text not null default 'active' check (status in ('active','paused','revoked')),
  last_amount    numeric(18,2),
  last_collected date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists dd_user_idx on public.direct_debits (user_id, status);

drop trigger if exists dd_set_updated on public.direct_debits;
create trigger dd_set_updated before update on public.direct_debits
  for each row execute function public.set_updated_at();

-- Cards. PANs are never stored — only the last four and a display token.
create table if not exists public.cards (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  kind          text not null default 'virtual' check (kind in ('virtual','physical')),
  scheme        text not null default 'visa' check (scheme in ('visa','mastercard')),
  last4         text not null,
  expiry_month  integer not null check (expiry_month between 1 and 12),
  expiry_year   integer not null,
  holder_name   text,
  label         text,
  status        text not null default 'active' check (status in ('active','frozen','cancelled','expired')),
  frozen_at     timestamptz,
  daily_limit   numeric(18,2),
  online_enabled  boolean not null default true,
  atm_enabled     boolean not null default true,
  contactless_enabled boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists cards_user_idx on public.cards (user_id, status);

drop trigger if exists cards_set_updated on public.cards;
create trigger cards_set_updated before update on public.cards
  for each row execute function public.set_updated_at();

-- Statements: one row per generated PDF period.
create table if not exists public.statements (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  account_type  text not null default 'checking' check (account_type in ('checking','savings')),
  period_start  date not null,
  period_end    date not null,
  opening_balance numeric(18,2) not null default 0,
  closing_balance numeric(18,2) not null default 0,
  credits_total numeric(18,2) not null default 0,
  debits_total  numeric(18,2) not null default 0,
  file_path     text,
  created_at    timestamptz not null default now(),
  unique (user_id, account_type, period_start, period_end)
);
create index if not exists statements_user_idx on public.statements (user_id, period_end desc);

-- ECB daily reference rates, so FX quotes have a defensible basis.
create table if not exists public.fx_rates (
  id          uuid primary key default uuid_generate_v4(),
  base        text not null default 'EUR',
  quote       text not null,
  rate        numeric(18,8) not null,
  as_of       date not null,
  source      text not null default 'ECB reference rate',
  created_at  timestamptz not null default now(),
  unique (base, quote, as_of)
);
create index if not exists fx_lookup_idx on public.fx_rates (quote, as_of desc);

-- Bank-wide settings an admin can change without a deploy.
create table if not exists public.bank_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.users(id),
  updated_at  timestamptz not null default now()
);

insert into public.bank_settings (key, value) values
  ('crypto_spread_bps', '149'),
  ('swift_fee_eur', '14'),
  ('fx_margin_pct', '0.35'),
  ('instant_transfer_ceiling_eur', 'null'),
  ('signup_open', 'true'),
  ('require_referral_code', 'false')
on conflict (key) do nothing;

-- Admin actions gains the target types 0003 introduced but never registered.
alter table public.admin_actions drop constraint if exists admin_actions_target_type_check;
alter table public.admin_actions add constraint admin_actions_target_type_check
  check (target_type in
    ('user','transfer','transaction','space','kyc_application','crypto_withdrawal',
     'referral_code','card','session','settings','statement'));

-- ────────────────────────────────────────────────────────────────────────────
-- Indexes the admin desk needs once there is real volume behind it
-- ────────────────────────────────────────────────────────────────────────────
create index if not exists tx_user_created_idx    on public.transactions (user_id, created_at desc);
create index if not exists tx_status_idx          on public.transactions (status) where status = 'pending';
create index if not exists transfers_status_idx   on public.transfers (status, created_at desc);
create index if not exists transfers_user_idx     on public.transfers (user_id, created_at desc);
-- (notifications.read is a boolean, and notif_unread_idx already exists above — nothing to add here)
create index if not exists otp_lookup_idx         on public.otp_codes (lower(email), purpose, created_at desc);

alter table public.referral_codes  enable row level security;
alter table public.referral_claims enable row level security;
alter table public.sessions        enable row level security;
alter table public.login_events    enable row level security;
alter table public.beneficiaries   enable row level security;
alter table public.standing_orders enable row level security;
alter table public.direct_debits   enable row level security;
alter table public.cards           enable row level security;
alter table public.statements      enable row level security;
alter table public.fx_rates        enable row level security;
alter table public.bank_settings   enable row level security;

-- ============================================================================
-- SEED — the two desks
--
-- Root admin : skibo   / skibo999    → owns every unreferred signup
-- Desk admin : Blaise  / Blaise999   → owns anyone who signs up with Blaise999
--
-- Password hashes are bcrypt of those passwords. CHANGE THEM BEFORE THIS IS
-- REACHABLE FROM THE INTERNET — they are published in this file, which means
-- they are not secrets.
-- ============================================================================

insert into public.users (
  email, username, password_hash, role, first_name, last_name,
  admin_label, onboarding_status, kyc_status, email_verified,
  balance_checking, balance_savings
) values (
  'skibo@ridgefordbank.eu', 'skibo',
  '$2a$12$HAKc3DXSFeHweDABg1w9k.G/D3R9zgI1AiHDA0FWWLm008AJKx3Em',
  'root_admin', 'Skibo', 'Ridgeford',
  'Head office', 'APPROVED', 'approved', true, 0, 0
)
on conflict (email) do update set
  role = 'root_admin',
  username = excluded.username,
  admin_label = excluded.admin_label;

insert into public.users (
  email, username, password_hash, role, first_name, last_name,
  admin_label, onboarding_status, kyc_status, email_verified,
  balance_checking, balance_savings
) values (
  'blaise@ridgefordbank.eu', 'Blaise',
  '$2a$12$QkGS0DJ2N9JHQEvEeMYe0OOdBei8uR6AgG/bTniKNE6Iy97rqNtmC',
  'admin', 'Blaise', 'Desk',
  'Blaise desk', 'APPROVED', 'approved', true, 0, 0
)
on conflict (email) do update set
  role = 'admin',
  username = excluded.username,
  admin_label = excluded.admin_label;

-- Every admin owns themselves, so joins never produce a null desk.
update public.users set admin_owner_id = id
where role in ('admin', 'root_admin') and admin_owner_id is null;

-- Blaise's referral code.
insert into public.referral_codes (code, admin_id, label, active)
select 'Blaise999', u.id, 'Blaise desk — public code', true
from public.users u where u.username = 'Blaise'
on conflict (lower(code)) do nothing;

-- Anything already in the database with no desk falls to the root admin.
update public.users u
set admin_owner_id = (select id from public.users where role = 'root_admin' limit 1)
where u.admin_owner_id is null and u.role = 'user';
