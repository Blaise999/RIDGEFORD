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
