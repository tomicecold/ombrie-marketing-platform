-- Phase 1: Initial schema for Ombrie Marketing Platform

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','marketing','sales','viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select using (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.ad_connections (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('meta','tiktok','google')),
  account_id text not null,
  account_name text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  connected_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(platform, account_id)
);

alter table public.ad_connections enable row level security;
create policy "Authenticated read connections" on public.ad_connections for select using (auth.role() = 'authenticated');
create policy "Admins write connections" on public.ad_connections for all using (exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'));
