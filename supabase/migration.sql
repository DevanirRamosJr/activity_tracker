-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- ============================================
-- TABLES
-- ============================================

create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color_bg text not null,
  color_text text not null,
  sort_order int default 0
);

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid not null references categories(id),
  title text not null,
  status text not null check (status in ('Want to', 'In Progress', 'Done')),
  notes text default '',
  image_url text,
  created_at timestamptz default now()
);

create table entry_history (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  user_id uuid references users(id),
  description text not null,
  created_at timestamptz default now()
);

create table user_entry_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  entry_id uuid not null references entries(id) on delete cascade,
  desire_level smallint not null check (desire_level between 1 and 10),
  rating smallint check (rating between 1 and 10),
  created_at timestamptz default now(),
  unique(user_id, entry_id)
);

-- ============================================
-- LOGIN FUNCTION (verifies password via pgcrypto)
-- ============================================

create or replace function login(p_username text, p_password text)
returns json
language plpgsql
security definer
as $$
declare
  v_user users;
begin
  select * into v_user
  from users
  where username = p_username
    and password_hash = crypt(p_password, password_hash);

  if v_user.id is null then
    return json_build_object('success', false);
  end if;

  return json_build_object(
    'success', true,
    'user', json_build_object('id', v_user.id, 'username', v_user.username)
  );
end;
$$;

-- ============================================
-- CHANGE PASSWORD FUNCTION (verifies current password, then updates)
-- ============================================

create or replace function change_password(
  p_user_id uuid,
  p_current_password text,
  p_new_password text
)
returns json
language plpgsql
security definer
as $$
declare
  v_user users;
begin
  select * into v_user
  from users
  where id = p_user_id
    and password_hash = crypt(p_current_password, password_hash);

  if v_user.id is null then
    return json_build_object('success', false, 'error', 'Current password is incorrect');
  end if;

  update users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_user_id;

  return json_build_object('success', true);
end;
$$;

-- ============================================
-- SEED DATA
-- ============================================

-- Categories (with Tailwind color classes)
insert into categories (name, color_bg, color_text, sort_order) values
  ('Movie',   'bg-blue-100',   'text-blue-700',   1),
  ('Cartoon', 'bg-yellow-100', 'text-yellow-700', 2),
  ('Series',  'bg-purple-100', 'text-purple-700', 3),
  ('Anime',   'bg-pink-100',   'text-pink-700',   4),
  ('Game',    'bg-green-100',  'text-green-700',   5);

-- Admin user (password: admin)
insert into users (username, password_hash)
values ('admin', crypt('admin', gen_salt('bf')));
