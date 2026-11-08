-- Ridgeford: country-guided international transfer requests, with reference FX quotes.
-- This migration does not change balances, historic transactions or existing transfers.
-- A banking settlement integration is required before a request can be called paid.

BEGIN;

CREATE TABLE IF NOT EXISTS public.fx_transfer_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  destination_country text NOT NULL CHECK (destination_country ~ '^[A-Z]{2}$'),
  source_currency text NOT NULL CHECK (source_currency IN ('EUR','USD')),
  recipient_currency text NOT NULL CHECK (recipient_currency ~ '^[A-Z]{3}$'),
  source_amount numeric(14,2) NOT NULL CHECK (source_amount > 0),
  recipient_amount numeric(18,2) NOT NULL CHECK (recipient_amount > 0),
  fx_rate numeric(24,12) NOT NULL CHECK (fx_rate > 0),
  fx_rate_date date NOT NULL,
  provider text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fx_transfer_quotes_user_idx ON public.fx_transfer_quotes (user_id, created_at DESC);
ALTER TABLE public.fx_transfer_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fx_transfer_quotes FROM PUBLIC, anon, authenticated;

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS fx_quote_id uuid REFERENCES public.fx_transfer_quotes(id),
  ADD COLUMN IF NOT EXISTS source_currency text,
  ADD COLUMN IF NOT EXISTS source_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS recipient_currency text,
  ADD COLUMN IF NOT EXISTS recipient_amount numeric(18,2),
  ADD COLUMN IF NOT EXISTS fx_rate numeric(24,12),
  ADD COLUMN IF NOT EXISTS fx_rate_date date,
  ADD COLUMN IF NOT EXISTS fx_rate_provider text,
  ADD COLUMN IF NOT EXISTS beneficiary_bank_name text,
  ADD COLUMN IF NOT EXISTS beneficiary_local_bank_code text;

CREATE UNIQUE INDEX IF NOT EXISTS transfers_one_fx_quote_idx
  ON public.transfers (fx_quote_id) WHERE fx_quote_id IS NOT NULL;

ALTER TABLE public.transfers DROP CONSTRAINT IF EXISTS transfers_status_check;
ALTER TABLE public.transfers ADD CONSTRAINT transfers_status_check
  CHECK (status IN ('pending_admin','approved','approved_pending_settlement','rejected','completed','canceled'));

COMMIT;
