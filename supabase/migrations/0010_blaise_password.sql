-- ============================================================================
-- Ridgeford — 0010
-- Blaise desk password → Blaise2006
--
-- bcrypt cost 12, verified against the app's own bcryptjs before shipping:
-- "Blaise2006" authenticates, "Blaise2005" no longer does.
--
-- The referral CODE is unchanged. Customers still sign up with "Blaise999"
-- to land on this desk — only the admin's own login password moved.
-- ============================================================================

update public.users
   set password_hash = '$2a$12$wfvjfXsBNtzFAiIDAgvVRelMlZrX2yNtPinqmRlQPAPjO3gyuSQ0y'
 where username = 'Blaise'
    or lower(email) = 'blaise@ridgefordbank.eu';

do $$
declare n int;
begin
  select count(*) into n
    from public.users
   where (username = 'Blaise' or lower(email) = 'blaise@ridgefordbank.eu')
     and password_hash = '$2a$12$wfvjfXsBNtzFAiIDAgvVRelMlZrX2yNtPinqmRlQPAPjO3gyuSQ0y';

  if n = 0 then
    raise notice 'No Blaise row updated — has migration 0004 (the admin seed) been run?';
  else
    raise notice 'Blaise password updated. Sign in with: Blaise / Blaise2006';
  end if;
end $$;
