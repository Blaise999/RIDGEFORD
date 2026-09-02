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
end $$;
