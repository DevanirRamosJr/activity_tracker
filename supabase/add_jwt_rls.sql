-- ============================================
-- JWT Auth + Row Level Security (Supabase-compatible)
-- Run this once in the Supabase SQL Editor.
--
-- BEFORE RUNNING: replace YOUR_SUPABASE_JWT_SECRET below with your
-- project's JWT secret, found in:
--   Dashboard → Project Settings → API → JWT Settings → "JWT Secret"
--   (the legacy HS256 secret — a long random string)
-- The token MUST be signed with this exact secret or Supabase will
-- reject it and every query will return empty.
-- ============================================

-- 1. Private schema to hold the signing secret (NOT exposed via the API —
--    PostgREST only serves the 'public' schema).
create schema if not exists private;

create table if not exists private.config (
  id int primary key default 1,
  jwt_secret text not null
);

insert into private.config (id, jwt_secret)
values (1, 'YOUR_SUPABASE_JWT_SECRET')
on conflict (id) do update set jwt_secret = excluded.jwt_secret;

-- 2. HS256 JWT signing helpers, built on pgcrypto (always available).
create or replace function public.url_encode(data bytea)
returns text language sql immutable as $$
  select translate(encode(data, 'base64'), E'+/=\n\r', '-_');
$$;

create or replace function public.sign_jwt(payload json, secret text)
returns text language sql immutable as $$
  with parts as (
    select
      public.url_encode(convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8')) || '.' ||
      public.url_encode(convert_to(payload::text, 'utf8')) as signing_input
  )
  select signing_input || '.' || public.url_encode(hmac(signing_input, secret, 'sha256'))
  from parts;
$$;

-- 3. Update login to return a signed JWT (sub = user id, role = authenticated).
create or replace function public.login(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user users;
  v_secret text;
  v_token text;
begin
  select * into v_user
  from users
  where username = p_username
    and password_hash = crypt(p_password, password_hash);

  if v_user.id is null then
    return json_build_object('success', false);
  end if;

  select jwt_secret into v_secret from private.config where id = 1;

  v_token := public.sign_jwt(
    json_build_object(
      'sub', v_user.id::text,
      'role', 'authenticated',
      'aud', 'authenticated',
      'username', v_user.username,
      'exp', extract(epoch from now() + interval '7 days')::int
    ),
    v_secret
  );

  return json_build_object(
    'success', true,
    'token', v_token,
    'user', json_build_object('id', v_user.id, 'username', v_user.username)
  );
end;
$$;

-- 4. Enable RLS on all tables.
alter table users enable row level security;
alter table categories enable row level security;
alter table entries enable row level security;
alter table entry_history enable row level security;
alter table user_entry_scores enable row level security;

-- 5. Policies (use Supabase's built-in auth.uid(), which reads the JWT 'sub').

drop policy if exists "users_select_own" on users;
create policy "users_select_own" on users
  for select using (id = auth.uid());

drop policy if exists "categories_select_all" on categories;
create policy "categories_select_all" on categories
  for select using (true);

drop policy if exists "entries_select" on entries;
create policy "entries_select" on entries
  for select using (auth.uid() is not null);

drop policy if exists "entries_insert" on entries;
create policy "entries_insert" on entries
  for insert with check (user_id = auth.uid());

drop policy if exists "entries_update" on entries;
create policy "entries_update" on entries
  for update using (user_id = auth.uid());

drop policy if exists "entries_delete" on entries;
create policy "entries_delete" on entries
  for delete using (user_id = auth.uid());

drop policy if exists "history_select" on entry_history;
create policy "history_select" on entry_history
  for select using (auth.uid() is not null);

drop policy if exists "history_insert" on entry_history;
create policy "history_insert" on entry_history
  for insert with check (user_id = auth.uid());

drop policy if exists "scores_select" on user_entry_scores;
create policy "scores_select" on user_entry_scores
  for select using (auth.uid() is not null);

drop policy if exists "scores_insert" on user_entry_scores;
create policy "scores_insert" on user_entry_scores
  for insert with check (user_id = auth.uid());

drop policy if exists "scores_update" on user_entry_scores;
create policy "scores_update" on user_entry_scores
  for update using (user_id = auth.uid());
