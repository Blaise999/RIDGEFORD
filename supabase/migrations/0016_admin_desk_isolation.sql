-- Ridgeford: reinforce per-admin isolation for international FX approvals.
-- Supersedes the function installed by migration 0015.
-- Ridgeford: approve an international FX request and debit its SOURCE currency.
-- Internal ledger approval ONLY. Does not execute an external wire/FX settlement.
-- Run AFTER 0015_fx_approval_ledger_debit.sql.
-- Uses row locks and one database transaction to prevent duplicate debits.

BEGIN;

-- Preserve all existing assignments. The original/root desk inherits only
-- legacy customers who have never had an owner; other desks stay untouched.
DO $$
DECLARE v_root uuid;
BEGIN
  SELECT id INTO v_root FROM public.users
   WHERE role = 'root_admin' ORDER BY created_at ASC LIMIT 1;
  IF v_root IS NULL THEN
    RAISE EXCEPTION 'Original root_admin is missing; apply 0004/0005 before 0016';
  END IF;
  UPDATE public.users SET admin_owner_id = v_root
   WHERE role = 'user' AND admin_owner_id IS NULL;
END $$;

-- Stop accidental or malicious cross-desk reassignments.
CREATE OR REPLACE FUNCTION public.ridgeford_guard_customer_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'user' AND OLD.admin_owner_id IS NOT NULL
       AND NEW.admin_owner_id IS DISTINCT FROM OLD.admin_owner_id THEN
      RAISE EXCEPTION 'Customer owner cannot be reassigned';
    END IF;
  END IF;
  IF NEW.role = 'user' AND NEW.admin_owner_id IS NULL THEN
    RAISE EXCEPTION 'A customer must belong to a desk';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ridgeford_guard_customer_owner_trigger ON public.users;
CREATE TRIGGER ridgeford_guard_customer_owner_trigger
BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW
EXECUTE FUNCTION public.ridgeford_guard_customer_owner();

CREATE OR REPLACE FUNCTION public.approve_fx_transfer_ledger(
  p_transfer_id uuid,
  p_admin_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transfer public.transfers%ROWTYPE;
  v_sender public.users%ROWTYPE;
  v_admin_role text;
  v_amount numeric(14,2);
  v_account_type text;
  v_balance_column text;
  v_changed integer;
BEGIN
  -- Never expose approval to user sessions. The server's service-role
  -- client calls this function after requireAdmin() authorization.
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  SELECT role INTO v_admin_role FROM public.users WHERE id = p_admin_id;
  IF v_admin_role NOT IN ('admin', 'root_admin') OR v_admin_role IS NULL THEN
    RAISE EXCEPTION 'Admin authorisation required';
  END IF;

  SELECT * INTO v_transfer FROM public.transfers
  WHERE id = p_transfer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;
  IF v_transfer.fx_quote_id IS NULL THEN
    RAISE EXCEPTION 'Not an FX transfer';
  END IF;
  IF v_transfer.status <> 'pending_admin' THEN
    RAISE EXCEPTION 'Transfer already reviewed: %', v_transfer.status;
  END IF;

  SELECT * INTO v_sender FROM public.users
  WHERE id = v_transfer.user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;
  IF v_sender.blocked THEN
    RAISE EXCEPTION 'Sender account is suspended';
  END IF;
  IF v_sender.admin_owner_id IS DISTINCT FROM p_admin_id THEN
    RAISE EXCEPTION 'Transfer is outside your assigned accounts';
  END IF;
  IF UPPER(COALESCE(v_sender.currency, 'EUR')) <> v_transfer.source_currency THEN
    RAISE EXCEPTION 'Account currency does not match transfer source currency';
  END IF;

  v_amount := v_transfer.source_amount;
  IF v_amount IS NULL OR v_amount <= 0 OR v_amount <> ROUND(v_amount, 2) THEN
    RAISE EXCEPTION 'Invalid amount to debit';
  END IF;
  IF COALESCE(v_transfer.fee, 0) <> 0 THEN
    RAISE EXCEPTION 'Cannot approve FX request with an unpriced fee';
  END IF;
  v_account_type := v_transfer.account_type;
  IF v_account_type NOT IN ('checking', 'savings') THEN
    RAISE EXCEPTION 'Unknown source account';
  END IF;

  IF v_account_type = 'savings' THEN
    UPDATE public.users
       SET balance_savings = balance_savings - v_amount
     WHERE id = v_sender.id AND balance_savings >= v_amount;
  ELSE
    UPDATE public.users
       SET balance_checking = balance_checking - v_amount
     WHERE id = v_sender.id AND balance_checking >= v_amount;
  END IF;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> 1 THEN
    RAISE EXCEPTION 'Insufficient balance for FX approval';
  END IF;

  -- The pending debit must exist. Any failure rolls back the balance change.
  UPDATE public.transactions
     SET status = 'posted'
   WHERE transfer_id = p_transfer_id
     AND user_id = v_sender.id
     AND account_type = v_account_type
     AND direction = 'debit'
     AND status = 'pending';
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> 1 THEN
    RAISE EXCEPTION 'Missing or duplicated pending debit ledger entry';
  END IF;

  UPDATE public.transfers
     SET status = 'approved',
         reviewed_at = NOW(),
         reviewed_by = p_admin_id,
         updated_at = NOW()
   WHERE id = p_transfer_id AND status = 'pending_admin';
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  IF v_changed <> 1 THEN
    RAISE EXCEPTION 'Transfer approval conflict';
  END IF;

  INSERT INTO public.admin_actions
    (admin_id, action, target_type, target_id, notes)
  VALUES
    (p_admin_id, 'approve_fx_ledger_debit', 'transfer', p_transfer_id,
     'Source-currency balance debited and ledger posted; external settlement unconfirmed');

  RETURN jsonb_build_object(
    'status', 'approved',
    'debited_amount', v_amount,
    'source_currency', v_transfer.source_currency,
    'recipient_currency', v_transfer.recipient_currency,
    'recipient_amount', v_transfer.recipient_amount,
    'externally_settled', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_fx_transfer_ledger(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_fx_transfer_ledger(uuid, uuid)
  TO service_role;

COMMIT;
