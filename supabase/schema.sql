-- ============================================================================
-- Ridgeford Capital Bank — Supabase schema
-- Run the ENTIRE file in the Supabase SQL editor.
-- Tables: users, spaces, transfers, transactions, notifications, otp_codes,
--         admin_actions.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- keeps updated_at fresh; defined early so every trigger below can use it
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- USERS
-- Starting balance is ZERO. Admin has to seed / edit before there's anything.
-- onboarding_status controls the user journey:
--   PENDING_REVIEW  → signup complete, waiting for admin review
--   APPROVED        → can use the app
--   REJECTED        → rejected, cannot sign in
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id                 uuid primary key default uuid_generate_v4(),
  email              text unique not null,
  password_hash      text not null,

  role               text not null default 'user' check (role in ('user','admin')),

  -- Identity
  first_name         text,
  middle_name        text,
  last_name          text,
  phone              text,
  date_of_birth      date,
  nationality        text,
  place_of_birth     text,

  -- Address
  street             text,
  street_number      text,
  city               text,
  postal_code        text,
  country            text default 'DE',

  -- Employment / financial (German bank onboarding)
  employment_status  text,          -- employed / self_employed / student / retired / unemployed
  employer           text,
  occupation         text,
  monthly_income     text,          -- income band
  source_of_funds    text,
  tax_id             text,          -- German Steuer-ID
  id_document_type   text,          -- passport / id_card
  id_document_number text,

  -- Banking
  iban               text unique,
  account_number     text,
  bic                text default 'RDGFDEFFXXX',
  card_last4         text,

  -- Balances (start at ZERO)
  balance_checking   numeric(14,2) not null default 0,
  balance_savings    numeric(14,2) not null default 0,

  -- Flags
  email_verified     boolean not null default false,
  blocked            boolean not null default false,
  blocked_reason     text,
  blocked_at         timestamptz,

  -- Onboarding
  onboarding_status  text not null default 'PENDING_REVIEW'
                     check (onboarding_status in ('PENDING_REVIEW','APPROVED','REJECTED')),
  rejection_reason   text,
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.users(id),

  -- Profile
  avatar_url         text,
  currency           text default 'EUR',
  locale             text default 'de-DE',
  timezone           text default 'Europe/Berlin',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_blocked_idx on public.users (blocked);
create index if not exists users_onboarding_idx on public.users (onboarding_status, created_at desc);
create index if not exists users_created_at_idx on public.users (created_at desc);

-- ----------------------------------------------------------------------------
-- SPACES
-- ----------------------------------------------------------------------------
create table if not exists public.spaces (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null,
  goal_amount   numeric(14,2) default 0,
  balance       numeric(14,2) not null default 0,
  target_date   date,
  locked_until  date,
  emoji         text default '💰',
  created_at    timestamptz not null default now()
);

-- In case an older deployment created the table without the new columns,
-- add them safely:
alter table public.spaces add column if not exists target_date  date;
alter table public.spaces add column if not exists locked_until date;
create index if not exists spaces_user_idx on public.spaces (user_id);

-- ----------------------------------------------------------------------------
-- TRANSFERS (intents)
-- ----------------------------------------------------------------------------
create table if not exists public.transfers (
  id                 uuid primary key default uuid_generate_v4(),
  reference_id       text unique not null,
  user_id            uuid not null references public.users(id) on delete cascade,

  rail               text not null check (rail in ('sepa','sepa_instant','internal','swift')),
  direction          text not null default 'debit' check (direction in ('debit','credit')),
  account_type       text not null default 'checking' check (account_type in ('checking','savings')),

  amount             numeric(14,2) not null check (amount > 0),
  currency           text not null default 'EUR',
  fee                numeric(14,2) not null default 0,

  beneficiary_name   text not null,
  beneficiary_iban   text,
  beneficiary_bic    text,
  beneficiary_email  text,
  beneficiary_user_id uuid references public.users(id),

  beneficiary_country  text,
  beneficiary_address  text,
  intermediary_bank    text,

  reference          text,
  memo               text,

  status             text not null default 'pending_admin'
                     check (status in ('pending_admin','approved','rejected','completed','canceled')),

  rejection_reason   text,

  submitted_at       timestamptz not null default now(),
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.users(id),
  completed_at       timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists transfers_user_idx      on public.transfers (user_id, created_at desc);
create index if not exists transfers_status_idx    on public.transfers (status, created_at desc);
create index if not exists transfers_reference_idx on public.transfers (reference_id);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  transfer_id    uuid references public.transfers(id) on delete set null,

  account_type   text not null default 'checking' check (account_type in ('checking','savings')),

  direction      text not null check (direction in ('debit','credit')),
  amount         numeric(14,2) not null,
  currency       text not null default 'EUR',

  rail           text check (rail in ('sepa','sepa_instant','internal','swift','card','fee','topup','salary','refund','adjustment')),
  category       text default 'Transfer' check (category in ('Transfer','Income','Bills','Dining','Groceries','Transport','Shopping','Refund','Subscriptions','Housing','Fee','Topup','Salary','Travel','Entertainment','Health')),

  counterparty_name  text,
  counterparty_iban  text,
  counterparty_email text,

  description    text,
  merchant       text,
  reference      text,

  status         text not null default 'posted' check (status in ('pending','posted','failed','reversed')),

  created_at     timestamptz not null default now()
);
create index if not exists tx_user_idx      on public.transactions (user_id, created_at desc);
create index if not exists tx_direction_idx on public.transactions (user_id, direction, created_at desc);
create index if not exists tx_account_idx   on public.transactions (user_id, account_type, created_at desc);
create index if not exists tx_transfer_idx  on public.transactions (transfer_id);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  kind          text not null check (kind in ('transfer_submitted','transfer_approved','transfer_rejected','account_blocked','account_unblocked','credit','debit','welcome','security','info','admin_adjustment','application_approved','application_rejected','support_reply')),
  title         text not null,
  body          text,
  metadata      jsonb,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notif_unread_idx on public.notifications (user_id, read) where read = false;

-- ----------------------------------------------------------------------------
-- OTP codes — for login + forget password
-- In dev with no RESEND_API_KEY, the app accepts "000000".
-- ----------------------------------------------------------------------------
create table if not exists public.otp_codes (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  code_hash   text not null,
  purpose     text not null check (purpose in ('login','password_reset','transfer')),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists otp_email_idx on public.otp_codes (email, purpose, created_at desc);

-- ----------------------------------------------------------------------------
-- SUPPORT CHAT
-- One conversation per user. Admin and user exchange messages in real time.
-- Realtime is delivered via Supabase Realtime (postgres_changes) on the
-- support_messages table, with a polling fallback in the client.
-- ----------------------------------------------------------------------------
create table if not exists public.support_conversations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references public.users(id) on delete cascade,

  status          text not null default 'open'
                  check (status in ('open','closed')),

  -- denormalised helpers for the admin inbox list
  last_message    text,
  last_message_at timestamptz,
  last_sender     text check (last_sender in ('user','admin')),

  -- unread counters, per side
  unread_admin    integer not null default 0,
  unread_user     integer not null default 0,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists supp_conv_user_idx
  on public.support_conversations (user_id);
create index if not exists supp_conv_activity_idx
  on public.support_conversations (last_message_at desc nulls last);
create index if not exists supp_conv_unread_idx
  on public.support_conversations (unread_admin)
  where unread_admin > 0;

create table if not exists public.support_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null
                  references public.support_conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,

  -- who wrote this line
  sender          text not null check (sender in ('user','admin')),
  sender_id       uuid references public.users(id),
  sender_name     text,

  body            text not null default '' check (char_length(body) <= 4000),
  image_url       text,

  read_by_user    boolean not null default false,
  read_by_admin   boolean not null default false,

  created_at      timestamptz not null default now()
);
create index if not exists supp_msg_conv_idx
  on public.support_messages (conversation_id, created_at asc);
create index if not exists supp_msg_user_idx
  on public.support_messages (user_id, created_at desc);

-- keep support_conversations.updated_at fresh
drop trigger if exists supp_conv_set_updated on public.support_conversations;
create trigger supp_conv_set_updated before update on public.support_conversations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ADMIN AUDIT
-- ----------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id            uuid primary key default uuid_generate_v4(),
  admin_id      uuid not null references public.users(id),
  action        text not null,
  target_type   text not null,
  target_id     uuid not null,
  notes         text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);
create index if not exists admin_actions_target_idx on public.admin_actions (target_type, target_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
-- (moved to the top of the file so triggers can reference it)


drop trigger if exists users_set_updated on public.users;
create trigger users_set_updated before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists transfers_set_updated on public.transfers;
create trigger transfers_set_updated before update on public.transfers
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — service role key bypasses.
-- ----------------------------------------------------------------------------
alter table public.users            enable row level security;
alter table public.spaces           enable row level security;
alter table public.transfers        enable row level security;
alter table public.transactions     enable row level security;
alter table public.notifications    enable row level security;
alter table public.otp_codes        enable row level security;
alter table public.admin_actions    enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages      enable row level security;

-- ----------------------------------------------------------------------------
-- REALTIME — broadcast row changes on the support tables so the chat UI
-- updates instantly. The app authorises every read/write through the
-- service-role key in API routes; the client only ever subscribes to
-- changes and then re-fetches through the authorised API, so it is safe
-- to publish these tables.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.support_messages;
alter publication supabase_realtime add table public.support_conversations;

-- Ensure full row data is delivered on UPDATE/DELETE events
alter table public.support_messages      replica identity full;
alter table public.support_conversations replica identity full;

-- ----------------------------------------------------------------------------
-- STORAGE — support chat image attachments
-- Public-read bucket. Uploads are performed server-side with the
-- service-role key, so no INSERT policy is needed for the anon role.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'support_attachments_public_read'
  ) then
    create policy "support_attachments_public_read"
      on storage.objects for select
      using (bucket_id = 'support-attachments');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- SEED — admin Valentine Nonny
-- password: val999 — bcrypt cost-10 hash below.
-- To regenerate:  node -e "console.log(require('bcryptjs').hashSync('val999',10))"
-- ----------------------------------------------------------------------------
insert into public.users (email, password_hash, role, first_name, last_name, email_verified, iban, balance_checking, balance_savings, onboarding_status)
values (
  'valentine@ridgefordbank.eu',
  '$2a$10$TQL.4qIqfdyDidAu608CNuiQzCnRIKGwe/vtfUB3ETonDk/j4A4cW',
  'admin',
  'Valentine',
  'Nonny',
  true,
  'DE00 0000 0000 0000 0000 00',
  0,
  0,
  'APPROVED'
)
on conflict (email) do nothing;


-- ============================================================================
-- 0003 — KYC + crypto desk (kept inline so this single file bootstraps a
-- brand-new project in one paste).
-- ============================================================================
-- ============================================================================
-- Ridgeford Capital Bank — 0003
-- (a) European bank-grade KYC / CDD onboarding
-- (b) Crypto desk: assets, holdings, orders, withdrawals, price cache
-- Safe to re-run.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- USERS — onboarding gains explicit KYC states
-- ----------------------------------------------------------------------------
alter table public.users drop constraint if exists users_onboarding_status_check;
alter table public.users
  add constraint users_onboarding_status_check
  check (onboarding_status in
    ('KYC_REQUIRED','KYC_SUBMITTED','PENDING_REVIEW','APPROVED','REJECTED'));

alter table public.users add column if not exists kyc_status  text default 'not_started';
alter table public.users add column if not exists kyc_risk    text;
alter table public.users add column if not exists kyc_approved_at timestamptz;
alter table public.users add column if not exists title       text;
alter table public.users add column if not exists gender      text;
alter table public.users add column if not exists country_of_birth text;
alter table public.users add column if not exists second_nationality text;
alter table public.users add column if not exists tax_residence_country text;
alter table public.users add column if not exists last_login_at timestamptz;
alter table public.users add column if not exists last_login_ip text;

-- ============================================================================
-- KYC APPLICATIONS
-- Modelled on what an EU credit institution actually has to collect under
-- AMLD5/6 + the EBA ML/TF risk factor guidelines, CRS (DAC2) and FATCA:
--   · identity + proof of identity document
--   · residential address + proof of address
--   · tax residence(s) and TIN, US-person self-certification
--   · employment, income band, source of funds AND source of wealth
--   · expected account activity (turnover, counterparties, countries)
--   · PEP / close-associate screening + sanctions + criminal declarations
--   · beneficial-owner / acting-on-own-behalf declaration
--   · explicit GDPR + terms + electronic-signature consents, with an
--     immutable audit trail (ip, user agent, timestamp, typed signature)
-- ============================================================================
create table if not exists public.kyc_applications (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references public.users(id) on delete cascade,

  status                  text not null default 'draft'
                          check (status in ('draft','submitted','in_review','more_info','approved','rejected')),
  step                    integer not null default 1,

  -- ── 1. Identity ────────────────────────────────────────────────────────
  title                   text,
  legal_first_name        text,
  legal_middle_name       text,
  legal_last_name         text,
  birth_name              text,
  date_of_birth           date,
  gender                  text,
  place_of_birth          text,
  country_of_birth        text,
  nationality             text,
  second_nationality      text,
  phone                   text,

  -- ── 2. Residence ───────────────────────────────────────────────────────
  residence_country       text,
  street                  text,
  street_number           text,
  address_extra           text,
  postal_code             text,
  city                    text,
  region                  text,
  resident_since          date,
  previous_address        text,

  -- ── 3. Tax residency (CRS / DAC2 + FATCA self-certification) ──────────
  tax_residence_country   text,
  tax_id                  text,
  second_tax_residence    text,
  second_tax_id           text,
  tin_unavailable_reason  text,
  us_person               boolean default false,
  us_tin                  text,

  -- ── 4. Employment & finances ───────────────────────────────────────────
  employment_status       text,
  employer_name           text,
  employer_country        text,
  occupation              text,
  industry                text,
  annual_income_band      text,
  net_worth_band          text,
  source_of_funds         text[],
  source_of_funds_detail  text,
  source_of_wealth        text,
  expected_monthly_inflow text,
  expected_monthly_outflow text,
  expected_countries      text[],
  account_purpose         text[],
  crypto_experience       text,
  expected_crypto_volume  text,

  -- ── 5. PEP / AML declarations ──────────────────────────────────────────
  is_pep                  boolean default false,
  pep_role                text,
  pep_country             text,
  pep_since               text,
  associate_pep           boolean default false,
  associate_pep_detail    text,
  acting_own_behalf       boolean default true,
  third_party_detail      text,
  sanctions_declaration   boolean default false,
  criminal_declaration    boolean default false,

  -- ── 6. Identity document ───────────────────────────────────────────────
  id_document_type        text,
  id_document_number      text,
  id_issuing_country      text,
  id_issuing_authority    text,
  id_issue_date           date,
  id_expiry_date          date,

  -- ── 7. Consents (GDPR Art. 6/7, eIDAS simple e-signature) ─────────────
  consent_terms           boolean default false,
  consent_privacy         boolean default false,
  consent_crs_fatca       boolean default false,
  consent_credit_check    boolean default false,
  consent_esign           boolean default false,
  consent_marketing       boolean default false,
  signature_name          text,
  signed_at               timestamptz,

  -- ── Audit / risk ───────────────────────────────────────────────────────
  ip_address              text,
  user_agent              text,
  locale                  text,
  risk_rating             text check (risk_rating in ('low','medium','high')),
  risk_score              integer,
  risk_factors            jsonb,
  screening_result        jsonb,
  review_notes            text,
  info_request            text,
  rejection_reason        text,
  reviewed_by             uuid references public.users(id),
  reviewed_at             timestamptz,
  submitted_at            timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists kyc_user_idx   on public.kyc_applications (user_id);
create index if not exists kyc_status_idx on public.kyc_applications (status, submitted_at desc);

drop trigger if exists kyc_set_updated on public.kyc_applications;
create trigger kyc_set_updated before update on public.kyc_applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- KYC DOCUMENTS — one row per uploaded file, stored in a PRIVATE bucket
-- ----------------------------------------------------------------------------
create table if not exists public.kyc_documents (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  application_id  uuid references public.kyc_applications(id) on delete cascade,

  kind            text not null check (kind in
                    ('id_front','id_back','selfie','proof_of_address','source_of_funds','tax_document','other')),
  file_path       text not null,
  file_name       text,
  mime_type       text,
  size_bytes      integer,

  status          text not null default 'uploaded'
                  check (status in ('uploaded','accepted','rejected')),
  review_note     text,

  created_at      timestamptz not null default now()
);
create index if not exists kyc_doc_user_idx on public.kyc_documents (user_id, created_at desc);
create index if not exists kyc_doc_app_idx  on public.kyc_documents (application_id);

-- ============================================================================
-- CRYPTO DESK
-- ============================================================================
create table if not exists public.crypto_assets (
  id             text primary key,               -- coingecko id, e.g. 'bitcoin'
  symbol         text not null,
  name           text not null,
  network        text not null,                  -- display network for withdrawals
  address_regex  text,                           -- validation for send-to-address
  needs_memo     boolean not null default false,
  decimals       integer not null default 8,
  network_fee    numeric(28,10) not null default 0,
  color          text default '#c9a227',
  sort_order     integer not null default 100,
  active         boolean not null default true
);

create table if not exists public.crypto_holdings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  asset_id      text not null references public.crypto_assets(id),
  quantity      numeric(28,10) not null default 0 check (quantity >= 0),
  invested_eur  numeric(18,2) not null default 0,
  pinned        boolean not null default true,   -- shown on the dashboard crypto bar
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, asset_id)
);
create index if not exists holdings_user_idx on public.crypto_holdings (user_id);

drop trigger if exists holdings_set_updated on public.crypto_holdings;
create trigger holdings_set_updated before update on public.crypto_holdings
  for each row execute function public.set_updated_at();

create table if not exists public.crypto_orders (
  id             uuid primary key default uuid_generate_v4(),
  reference_id   text unique not null,
  user_id        uuid not null references public.users(id) on delete cascade,
  asset_id       text not null references public.crypto_assets(id),

  side           text not null check (side in ('buy','sell')),
  account_type   text not null default 'checking' check (account_type in ('checking','savings')),

  eur_amount     numeric(18,2) not null check (eur_amount > 0),  -- gross debited / net credited
  fee_eur        numeric(18,2) not null default 0,
  spread_bps     integer not null default 0,
  unit_price_eur numeric(28,10) not null,
  quantity       numeric(28,10) not null check (quantity > 0),

  status         text not null default 'filled'
                 check (status in ('filled','failed','canceled')),
  destination    text not null default 'hold'
                 check (destination in ('hold','withdraw')),

  created_at     timestamptz not null default now()
);
create index if not exists orders_user_idx on public.crypto_orders (user_id, created_at desc);

create table if not exists public.crypto_withdrawals (
  id              uuid primary key default uuid_generate_v4(),
  reference_id    text unique not null,
  user_id         uuid not null references public.users(id) on delete cascade,
  asset_id        text not null references public.crypto_assets(id),
  order_id        uuid references public.crypto_orders(id) on delete set null,

  quantity        numeric(28,10) not null check (quantity > 0),
  network_fee     numeric(28,10) not null default 0,
  unit_price_eur  numeric(28,10) not null,
  eur_value       numeric(18,2) not null,

  network         text not null,
  address         text not null,
  memo            text,
  note            text,

  status          text not null default 'pending_admin'
                  check (status in ('pending_admin','approved','sent','rejected','canceled')),
  tx_hash         text,
  rejection_reason text,
  reviewed_by     uuid references public.users(id),
  reviewed_at     timestamptz,
  sent_at         timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists cw_user_idx   on public.crypto_withdrawals (user_id, created_at desc);
create index if not exists cw_status_idx on public.crypto_withdrawals (status, created_at desc);

drop trigger if exists cw_set_updated on public.crypto_withdrawals;
create trigger cw_set_updated before update on public.crypto_withdrawals
  for each row execute function public.set_updated_at();

-- Last known good market data. Keeps the desk usable when the upstream
-- price feed is rate-limited or unreachable.
create table if not exists public.crypto_price_cache (
  asset_id     text primary key references public.crypto_assets(id) on delete cascade,
  price_eur    numeric(28,10) not null,
  change_24h   numeric(10,4),
  change_7d    numeric(10,4),
  market_cap   numeric(24,2),
  volume_24h   numeric(24,2),
  high_24h     numeric(28,10),
  low_24h      numeric(28,10),
  sparkline    jsonb,
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Existing check constraints need the new crypto / KYC vocabulary
-- ----------------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_rail_check;
alter table public.transactions add constraint transactions_rail_check
  check (rail in ('sepa','sepa_instant','internal','swift','card','fee','topup',
                  'salary','refund','adjustment','crypto_buy','crypto_sell'));

alter table public.transactions drop constraint if exists transactions_category_check;
alter table public.transactions add constraint transactions_category_check
  check (category in ('Transfer','Income','Bills','Dining','Groceries','Transport',
                      'Shopping','Refund','Subscriptions','Housing','Fee','Topup',
                      'Salary','Travel','Entertainment','Health','Crypto','Investments'));

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('transfer_submitted','transfer_approved','transfer_rejected',
                  'account_blocked','account_unblocked','credit','debit','welcome',
                  'security','info','admin_adjustment','application_approved',
                  'application_rejected','support_reply',
                  'kyc_submitted','kyc_approved','kyc_rejected','kyc_more_info',
                  'crypto_buy','crypto_sell','crypto_send_submitted',
                  'crypto_send_approved','crypto_send_rejected'));

alter table public.otp_codes drop constraint if exists otp_codes_purpose_check;
alter table public.otp_codes add constraint otp_codes_purpose_check
  check (purpose in ('login','password_reset','transfer','crypto_withdrawal'));

-- ----------------------------------------------------------------------------
-- RLS — every read/write goes through the service role in API routes
-- ----------------------------------------------------------------------------
alter table public.kyc_applications   enable row level security;
alter table public.kyc_documents      enable row level security;
alter table public.crypto_assets      enable row level security;
alter table public.crypto_holdings    enable row level security;
alter table public.crypto_orders      enable row level security;
alter table public.crypto_withdrawals enable row level security;
alter table public.crypto_price_cache enable row level security;

-- ----------------------------------------------------------------------------
-- STORAGE — KYC uploads are PRIVATE. Admin views them through short-lived
-- signed URLs minted server-side; there is no public read policy.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- SEED — tradable assets on the Ridgeford desk
-- ----------------------------------------------------------------------------
insert into public.crypto_assets (id, symbol, name, network, address_regex, needs_memo, decimals, network_fee, color, sort_order) values
  ('bitcoin','BTC','Bitcoin','Bitcoin','^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$',false,8,0.00008,'#f7931a',1),
  ('ethereum','ETH','Ethereum','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,8,0.0009,'#627eea',2),
  ('tether','USDT','Tether','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,6,6.5,'#26a17b',3),
  ('solana','SOL','Solana','Solana','^[1-9A-HJ-NP-Za-km-z]{32,44}$',false,8,0.001,'#14f195',4),
  ('usd-coin','USDC','USD Coin','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,6,6.5,'#2775ca',5),
  ('ripple','XRP','XRP','XRP Ledger','^r[0-9a-zA-Z]{24,34}$',true,6,0.2,'#23292f',6),
  ('cardano','ADA','Cardano','Cardano','^(addr1)[a-z0-9]{20,110}$',false,6,1.0,'#0033ad',7),
  ('avalanche-2','AVAX','Avalanche','Avalanche C-Chain','^0x[a-fA-F0-9]{40}$',false,8,0.01,'#e84142',8),
  ('chainlink','LINK','Chainlink','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,8,0.32,'#2a5ada',9),
  ('polkadot','DOT','Polkadot','Polkadot','^1[a-zA-Z0-9]{45,49}$',false,8,0.12,'#e6007a',10),
  ('litecoin','LTC','Litecoin','Litecoin','^(ltc1[a-z0-9]{25,62}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$',false,8,0.001,'#a6a9aa',11),
  ('dogecoin','DOGE','Dogecoin','Dogecoin','^D[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$',false,8,2.0,'#c2a633',12),
  ('polygon-ecosystem-token','POL','Polygon','Polygon','^0x[a-fA-F0-9]{40}$',false,8,0.05,'#8247e5',13),
  ('tron','TRX','TRON','TRON (TRC-20)','^T[1-9A-HJ-NP-Za-km-z]{33}$',false,6,1.0,'#ff060a',14),
  ('uniswap','UNI','Uniswap','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,8,0.45,'#ff007a',15),
  ('stellar','XLM','Stellar','Stellar','^G[A-Z2-7]{55}$',true,7,0.05,'#7d00ff',16),
  ('cosmos','ATOM','Cosmos','Cosmos Hub','^cosmos1[a-z0-9]{38}$',true,6,0.01,'#2e3148',17),
  ('near','NEAR','NEAR Protocol','NEAR','^[a-z0-9_\-\.]{2,64}$',false,8,0.02,'#00c1de',18),
  ('aave','AAVE','Aave','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,8,0.02,'#b6509e',19),
  ('arbitrum','ARB','Arbitrum','Arbitrum One','^0x[a-fA-F0-9]{40}$',false,8,0.3,'#28a0f0',20),
  ('optimism','OP','Optimism','Optimism','^0x[a-fA-F0-9]{40}$',false,8,0.3,'#ff0420',21),
  ('injective-protocol','INJ','Injective','Injective','^inj1[a-z0-9]{38}$',true,8,0.01,'#00a2ff',22),
  ('render-token','RENDER','Render','Solana','^[1-9A-HJ-NP-Za-km-z]{32,44}$',false,8,0.05,'#ff5c1c',23),
  ('the-graph','GRT','The Graph','Ethereum (ERC-20)','^0x[a-fA-F0-9]{40}$',false,8,6.0,'#6747ed',24),
  ('algorand','ALGO','Algorand','Algorand','^[A-Z2-7]{58}$',true,6,0.1,'#00d1a0',25),
  ('filecoin','FIL','Filecoin','Filecoin','^f[0-9][a-z0-9]{8,90}$',false,8,0.02,'#0090ff',26),
  ('hedera-hashgraph','HBAR','Hedera','Hedera','^0\.0\.[0-9]{3,12}$',true,8,0.5,'#00b5ad',27),
  ('sui','SUI','Sui','Sui','^0x[a-fA-F0-9]{64}$',false,8,0.02,'#4da2ff',28),
  ('mantle','MNT','Mantle','Mantle','^0x[a-fA-F0-9]{40}$',false,8,0.3,'#65b3ae',29),
  ('monero','XMR','Monero','Monero','^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$',false,8,0.0002,'#ff6600',30)
on conflict (id) do update set
  symbol = excluded.symbol,
  name = excluded.name,
  network = excluded.network,
  address_regex = excluded.address_regex,
  needs_memo = excluded.needs_memo,
  network_fee = excluded.network_fee,
  color = excluded.color,
  sort_order = excluded.sort_order;

-- ============================================================================
-- 0004 — admin hierarchy, referral codes, and the remaining gaps.
-- ============================================================================
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

-- ============================================================================
-- 0005 — RLS hardening, storage lockdown, and audit repairs.
-- ============================================================================
-- ============================================================================
-- Ridgeford Capital Bank — 0005
-- Diagnose the "new row violates row-level security policy" error, then
-- harden the RLS posture so it can never happen silently again.
--
-- Paste the WHOLE file into the Supabase SQL editor and run it.
-- It is read-only in Part 1 and idempotent in Parts 2–4. Safe to re-run.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- PART 1 — DIAGNOSIS  (read-only; look at the NOTICE output)
--
-- Read this first, because SQL almost certainly cannot fix your error.
--
-- This app does NOT use Supabase Auth. It has its own session JWT and its own
-- bcrypt password hashes, so inside Postgres `auth.uid()` is ALWAYS NULL. That
-- means no RLS policy keyed to auth.uid() could ever match, and none is meant
-- to: every read and write is supposed to go through the SERVICE ROLE, which
-- bypasses RLS entirely.
--
-- Therefore, if you saw:
--
--     new row violates row-level security policy for table "users"
--
-- ...then the request was NOT made with the service role. RLS did its job.
-- The value in SUPABASE_SERVICE_ROLE_KEY is not a service-role key.
--
-- The usual cause, since Supabase changed its key format: you copied the
-- PUBLISHABLE key (`sb_publishable_...`, formerly "anon") instead of the
-- SECRET one (`sb_secret_...`, formerly "service_role"). They sit next to each
-- other in Project Settings → API Keys and are easy to mix up.
--
--   Fix: Project Settings → API Keys → copy the SECRET / service_role key
--        → paste into SUPABASE_SERVICE_ROLE_KEY → restart the dev server.
--        (Next.js only reads .env.local at boot — it will not hot-reload it.)
--
-- Do NOT "fix" this by adding an INSERT policy for anon on public.users.
-- That would let anyone on the internet create rows in your users table,
-- including rows with role = 'root_admin'.
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_role      text := current_user;
  v_rls_on    int;
  v_no_policy int;
  v_users     int;
  v_admins    int;
  v_codes     int;
begin
  select count(*) into v_rls_on
    from pg_tables where schemaname = 'public' and rowsecurity = true;

  select count(*) into v_no_policy
    from pg_tables t
    where t.schemaname = 'public'
      and t.rowsecurity = true
      and not exists (
        select 1 from pg_policies p
        where p.schemaname = 'public' and p.tablename = t.tablename
      );

  select count(*) into v_users  from public.users;
  select count(*) into v_admins from public.users where role in ('admin','root_admin');
  select count(*) into v_codes  from public.referral_codes;

  raise notice '───────────────────────────────────────────────';
  raise notice 'Connected as              : %', v_role;
  raise notice 'Tables with RLS enabled   : %', v_rls_on;
  raise notice 'Of those, with 0 policies : %  (expected — service role bypasses RLS)', v_no_policy;
  raise notice 'users rows                : %', v_users;
  raise notice 'admin / root_admin rows   : %', v_admins;
  raise notice 'referral codes            : %', v_codes;
  raise notice '───────────────────────────────────────────────';

  if v_admins = 0 then
    raise notice 'WARNING: no admins found — migration 0004 seed did not run.';
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2 — HARDENING
--
-- RLS was enabled on every table but no GRANTs were ever revoked. That is a
-- real gap: RLS is the second line of defence, and the first line (table
-- privileges) was never closed. If RLS were ever accidentally disabled on a
-- table, the publishable key could read it.
--
-- Belt and braces: revoke everything from anon and authenticated, so the only
-- role that can touch these tables is the service role.
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('revoke all on public.%I from anon, authenticated', r.tablename);
  end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Future tables inherit the same posture, so a later migration cannot
-- accidentally leave something open.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

-- The live support chat subscribes over Realtime with the publishable key and
-- needs nothing more than the ability to receive change events, which does not
-- require table SELECT. If you later want browser-side reads, grant them
-- narrowly and write a real policy — do not re-grant the whole schema.


-- ════════════════════════════════════════════════════════════════════════════
-- PART 3 — KYC DOCUMENT STORAGE
--
-- 0003 created the private `kyc-documents` bucket but never wrote storage
-- policies. Service role bypasses them, so uploads worked — but the bucket had
-- no explicit deny for anyone else, which is not a posture you want on a
-- folder full of passport scans.
-- ════════════════════════════════════════════════════════════════════════════

-- Wrapped: on some Supabase projects the SQL editor role does not own
-- storage.objects, and a bare CREATE POLICY there would abort the whole
-- script. A warning is fine; the bucket is already private and the service
-- role is the only thing that touches it.
do $$
begin
  update storage.buckets set public = false where id = 'kyc-documents';

  drop policy if exists "kyc_documents_deny_anon_select" on storage.objects;
  drop policy if exists "kyc_documents_deny_anon_insert" on storage.objects;

  -- No grant to anon/authenticated for this bucket = no access. Admins read
  -- documents through short-lived signed URLs minted server-side, which is
  -- what /api/admin/kyc/[id] already does.
  create policy "kyc_documents_deny_anon_select"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id <> 'kyc-documents');

  create policy "kyc_documents_deny_anon_insert"
    on storage.objects for insert
    to anon, authenticated
    with check (bucket_id <> 'kyc-documents');

  raise notice 'Storage: kyc-documents locked to service role.';
exception when insufficient_privilege or undefined_table then
  raise notice 'Storage: skipped (this role does not own storage.objects).';
  raise notice 'Storage: set the bucket to Private in the dashboard instead.';
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- PART 4 — SMALL REPAIRS FOUND WHILE AUDITING
-- ════════════════════════════════════════════════════════════════════════════

-- 4a. The original seed admin from 0001 predates the two-tier model and has no
--     desk. Give every admin ownership of themselves so joins never see NULL.
update public.users
   set admin_owner_id = id
 where role in ('admin', 'root_admin')
   and admin_owner_id is null;

-- 4b. Any customer with no desk falls to head office. This also catches rows
--     created between running 0004 and deploying the new signup route.
update public.users u
   set admin_owner_id = (
         select id from public.users
          where role = 'root_admin'
          order by created_at
          limit 1
       )
 where u.role = 'user'
   and u.admin_owner_id is null;

-- 4c. `users.username` is what the two admins log in with. Backfill it for the
--     seeded accounts in case 0004's ON CONFLICT path skipped the update.
update public.users set username = 'skibo'  where email = 'skibo@ridgefordbank.eu'  and username is null;
update public.users set username = 'Blaise' where email = 'blaise@ridgefordbank.eu' and username is null;

-- 4d. Guarantee Blaise's code exists even if 0004's seed ran before the user
--     row did.
insert into public.referral_codes (code, admin_id, label, active)
select 'Blaise999', u.id, 'Blaise desk — public code', true
  from public.users u
 where u.username = 'Blaise'
   and not exists (select 1 from public.referral_codes where lower(code) = 'blaise999');

-- 4e. otp_codes.email is compared case-insensitively in the app but indexed
--     case-sensitively, so the lookup index was never used on a mixed-case
--     address. Add the expression index that matches the query.
create index if not exists otp_email_lower_idx
  on public.otp_codes (lower(email), purpose, created_at desc);

-- 4f. The transfers queue is filtered by status + user in the admin desk.
create index if not exists transfers_user_status_idx
  on public.transfers (user_id, status, created_at desc);


-- ════════════════════════════════════════════════════════════════════════════
-- PART 5 — CONFIRM
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_orphans int;
  v_admins  int;
begin
  select count(*) into v_orphans from public.users where admin_owner_id is null;
  select count(*) into v_admins  from public.users where role in ('admin','root_admin');

  raise notice '───────────────────────────────────────────────';
  raise notice 'Admins            : %', v_admins;
  raise notice 'Users with no desk: %  (should be 0)', v_orphans;
  raise notice 'Anon/authenticated privileges on public.*: revoked';
  raise notice '';
  raise notice 'If signup still fails with an RLS error, the problem is the';
  raise notice 'KEY, not the database. See PART 1 at the top of this file.';
  raise notice '───────────────────────────────────────────────';
end $$;\n\n-- ============================================================================\n-- 0006 — coin logos on cached market data.\n-- ============================================================================\n-- ============================================================================
-- Ridgeford Capital Bank — 0006
-- Coin logos on the cached market data.
--
-- The keyless CoinGecko markets response already carries a CDN-hosted logo per
-- asset. Persisting it means the desk still shows logos on a cold start, when
-- the in-memory cache is empty and the upstream feed is rate-limited.
-- ============================================================================

alter table public.crypto_price_cache add column if not exists image text;

-- ============================================================================
-- 0007 — avatar storage.
-- ============================================================================
-- ============================================================================
-- Ridgeford Capital Bank — 0007
-- Avatar storage.
--
-- users.avatar_url was being filled with base64 data URLs from the settings
-- page — a 3 MB photo became ~4 MB of text on the user row, carried by every
-- query that selected a user. The column now holds a URL, as intended.
--
-- This bucket is PUBLIC, unlike kyc-documents: a profile picture is shown in
-- the topbar, in support threads and to admins, and signing a URL for every
-- one of those would be a lot of machinery to protect a photo the customer
-- chose to display.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 4194304,
  array['image/jpeg','image/png','image/webp','image/heic','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may READ an avatar (that is the point of a public bucket); only the
-- service role writes, which is what the upload route uses.
do $$
begin
  drop policy if exists "avatars are publicly readable" on storage.objects;
  create policy "avatars are publicly readable"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'avatars');
  raise notice 'Storage: avatars bucket ready.';
exception when insufficient_privilege or undefined_table then
  raise notice 'Storage: could not set avatar policy — create the bucket in the dashboard and mark it Public.';
end $$;

-- Clear any base64 blobs the old settings page wrote. They are unusable as
-- URLs and enormous; customers simply re-upload.
update public.users
   set avatar_url = null
 where avatar_url like 'data:%';
