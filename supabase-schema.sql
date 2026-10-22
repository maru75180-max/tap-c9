-- Tap C9 initial schema
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- Security: public users can read published profiles only.
-- Authenticated users can write profiles only if they are listed in admin_users.
-- Do not place service_role keys in frontend code.

create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  job_title text,
  company text,
  category text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  phone text,
  email text,
  whatsapp text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  address text,
  bio text,
  photo_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.tap_c9_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.tap_c9_is_admin() from public;
grant execute on function public.tap_c9_is_admin() to authenticated;

create or replace function public.tap_c9_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists client_profiles_set_updated_at on public.client_profiles;
create trigger client_profiles_set_updated_at
before update on public.client_profiles
for each row execute function public.tap_c9_set_updated_at();

alter table public.client_profiles enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read published profiles" on public.client_profiles;
create policy "Public can read published profiles"
on public.client_profiles for select
to anon, authenticated
using (is_published = true or public.tap_c9_is_admin());

drop policy if exists "Admins can insert profiles" on public.client_profiles;
create policy "Admins can insert profiles"
on public.client_profiles for insert
to authenticated
with check (public.tap_c9_is_admin());

drop policy if exists "Admins can update profiles" on public.client_profiles;
create policy "Admins can update profiles"
on public.client_profiles for update
to authenticated
using (public.tap_c9_is_admin())
with check (public.tap_c9_is_admin());

drop policy if exists "Admins can delete profiles" on public.client_profiles;
create policy "Admins can delete profiles"
on public.client_profiles for delete
to authenticated
using (public.tap_c9_is_admin());

-- No client-side policies are granted on admin_users.
-- Add your own admin account using the one-time SQL below after creating the user
-- in Authentication > Users. Replace the UUID placeholder with that user's ID:
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID-HERE');
