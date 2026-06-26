-- Fathom — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- One table holds everyone's soundings. Row-Level Security guarantees each
-- signed-in user can only read or write their OWN rows, so "your data is your
-- own" is enforced by the database itself — not just the app.

create table if not exists public.soundings (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fast "my soundings, newest first" reads.
create index if not exists soundings_user_updated_idx
  on public.soundings (user_id, updated_at desc);

-- Lock the table down, then allow each user to touch only their rows.
alter table public.soundings enable row level security;

drop policy if exists "select own soundings" on public.soundings;
create policy "select own soundings"
  on public.soundings for select
  using (auth.uid() = user_id);

drop policy if exists "insert own soundings" on public.soundings;
create policy "insert own soundings"
  on public.soundings for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own soundings" on public.soundings;
create policy "update own soundings"
  on public.soundings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own soundings" on public.soundings;
create policy "delete own soundings"
  on public.soundings for delete
  using (auth.uid() = user_id);
