-- ============================================================================
-- Migration: Support chat (real-time admin <-> user messaging)
--
-- Safe to run on an EXISTING Crest Capital database. It only ADDS objects;
-- it never drops or alters existing data. Run the whole file in the
-- Supabase SQL editor.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---- tables ----------------------------------------------------------------
create table if not exists public.support_conversations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references public.users(id) on delete cascade,
  status          text not null default 'open' check (status in ('open','closed')),
  last_message    text,
  last_message_at timestamptz,
  last_sender     text check (last_sender in ('user','admin')),
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
  on public.support_conversations (unread_admin) where unread_admin > 0;

create table if not exists public.support_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  sender          text not null check (sender in ('user','admin')),
  sender_id       uuid references public.users(id),
  sender_name     text,
  body            text not null check (char_length(body) between 1 and 4000),
  read_by_user    boolean not null default false,
  read_by_admin   boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists supp_msg_conv_idx
  on public.support_messages (conversation_id, created_at asc);
create index if not exists supp_msg_user_idx
  on public.support_messages (user_id, created_at desc);

-- ---- updated_at trigger ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists supp_conv_set_updated on public.support_conversations;
create trigger supp_conv_set_updated before update on public.support_conversations
  for each row execute function public.set_updated_at();

-- ---- notification kind -----------------------------------------------------
-- Allow the new 'support_reply' notification kind. Rebuild the CHECK
-- constraint to include it (no-op if it is already present).
do $$
begin
  alter table public.notifications drop constraint if exists notifications_kind_check;
  alter table public.notifications
    add constraint notifications_kind_check
    check (kind in (
      'transfer_submitted','transfer_approved','transfer_rejected',
      'account_blocked','account_unblocked','credit','debit','welcome',
      'security','info','admin_adjustment','application_approved',
      'application_rejected','support_reply'
    ));
exception when others then
  -- if the constraint had a different name in an older deploy, ignore
  null;
end$$;

-- ---- RLS -------------------------------------------------------------------
alter table public.support_conversations enable row level security;
alter table public.support_messages      enable row level security;

-- ---- Realtime --------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

-- add tables to the realtime publication (ignore "already member" errors)
do $$
begin
  alter publication supabase_realtime add table public.support_messages;
exception when duplicate_object then null;
end$$;

do $$
begin
  alter publication supabase_realtime add table public.support_conversations;
exception when duplicate_object then null;
end$$;

alter table public.support_messages      replica identity full;
alter table public.support_conversations replica identity full;

-- Done. The app talks to these tables exclusively through the service-role
-- key in server API routes; the browser only SUBSCRIBES to changes (via the
-- anon key) and then re-fetches through the authorised API.
