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
