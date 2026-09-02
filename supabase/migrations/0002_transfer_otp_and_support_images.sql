-- ============================================================================
-- Migration: Transfer OTP + Support image attachments
--
-- Safe to run on an EXISTING Crest Capital database. Only ADDS / widens
-- constraints; never drops data. Run the whole file in the Supabase SQL
-- editor.
-- ============================================================================

-- ---- 1. OTP: allow 'transfer' purpose --------------------------------------
-- A transfer now requires the user to confirm an emailed 6-digit code,
-- exactly like a bank. We reuse the existing otp_codes table.
do $$
begin
  alter table public.otp_codes drop constraint if exists otp_codes_purpose_check;
  alter table public.otp_codes
    add constraint otp_codes_purpose_check
    check (purpose in ('login','password_reset','transfer'));
exception when others then
  null;
end$$;

-- ---- 2. Support messages: image attachment + body may be empty ------------
alter table public.support_messages
  add column if not exists image_url text;

do $$
begin
  alter table public.support_messages drop constraint if exists support_messages_body_check;
  alter table public.support_messages
    add constraint support_messages_body_check
    check (char_length(body) <= 4000);
exception when others then
  null;
end$$;

alter table public.support_messages
  alter column body set default '';

-- ---- 3. Storage bucket for support attachments ----------------------------
-- Public-read bucket; uploads happen server-side with the service-role key.
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

-- Done.
