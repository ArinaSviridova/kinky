-- Kinky Party Pre-Match MVP schema
-- Run this in Supabase SQL Editor.
-- Boring note from the abyss: keep RLS enabled and do app operations through Netlify Functions.

create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_provider text not null check (auth_provider in ('telegram', 'google')),
  telegram_id text unique,
  telegram_username text,
  google_email text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  last_login_at timestamptz default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid references app_users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('owner', 'admin', 'moderator', 'editor')),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(app_user_id)
);

create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  access_opens_at timestamptz not null,
  access_closes_at timestamptz not null,
  access_key_hash text not null,
  is_active boolean default true,

  logo_url text default '/kinky-logo.png',
  cover_url text,
  theme jsonb default '{}'::jsonb,

  rules_text text,
  dress_code_text text,
  pinterest_links jsonb default '[]'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists party_access (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(party_id, user_id)
);

create table if not exists party_profiles (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  user_id uuid references app_users(id) on delete cascade,

  nickname text not null,
  telegram_username text not null,
  bio text not null,
  photo_urls jsonb default '[]'::jsonb,

  going_as text,
  interested_in text[] default '{}',
  looking_for text[] default '{}',
  approach_preferences text[] default '{}',
  boundaries text[] default '{}',
  languages text[] default '{}',
  icebreaker text,

  is_visible boolean default true,
  is_blocked boolean default false,

  accepted_rules boolean default false,
  accepted_privacy boolean default false,
  confirmed_18_plus boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (party_id, user_id)
);

create table if not exists profile_likes (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  from_profile_id uuid references party_profiles(id) on delete cascade,
  to_profile_id uuid references party_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_profile_id, to_profile_id),
  check (from_profile_id <> to_profile_id)
);

create table if not exists profile_matches (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  profile_a_id uuid references party_profiles(id) on delete cascade,
  profile_b_id uuid references party_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (profile_a_id, profile_b_id),
  check (profile_a_id <> profile_b_id)
);

create table if not exists profile_reports (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  reporter_profile_id uuid references party_profiles(id) on delete cascade,
  reported_profile_id uuid references party_profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'new' check (status in ('new', 'in_progress', 'done', 'dismissed')),
  created_at timestamptz default now()
);

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references app_users(id),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table app_users enable row level security;
alter table admin_users enable row level security;
alter table parties enable row level security;
alter table party_access enable row level security;
alter table party_profiles enable row level security;
alter table profile_likes enable row level security;
alter table profile_matches enable row level security;
alter table profile_reports enable row level security;
alter table admin_logs enable row level security;

-- No public policies are created on purpose.
-- The browser uses Netlify Functions, and the functions use SUPABASE_SERVICE_ROLE_KEY.

create index if not exists idx_party_profiles_party on party_profiles(party_id);
create index if not exists idx_profile_likes_party on profile_likes(party_id);
create index if not exists idx_profile_matches_party on profile_matches(party_id);
create index if not exists idx_profile_reports_party on profile_reports(party_id);
create index if not exists idx_party_access_user_party on party_access(user_id, party_id);
