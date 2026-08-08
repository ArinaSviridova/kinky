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
  pending_email text,
  pending_telegram_username text,
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

-- UX update migration: bilingual fields, event media, access persistence and speed indexes.
alter table parties add column if not exists title_ru text;
alter table parties add column if not exists title_en text;
alter table parties add column if not exists description_ru text;
alter table parties add column if not exists description_en text;
alter table parties add column if not exists location_ru text;
alter table parties add column if not exists location_en text;
alter table parties add column if not exists rules_text_ru text;
alter table parties add column if not exists rules_text_en text;
alter table parties add column if not exists dress_code_text_ru text;
alter table parties add column if not exists dress_code_text_en text;

alter table party_profiles add column if not exists bio_ru text;
alter table party_profiles add column if not exists bio_en text;
alter table party_profiles add column if not exists looking_for_text_ru text;
alter table party_profiles add column if not exists looking_for_text_en text;
alter table party_profiles add column if not exists approach_text_ru text;
alter table party_profiles add column if not exists approach_text_en text;
alter table party_profiles add column if not exists boundaries_text_ru text;
alter table party_profiles add column if not exists boundaries_text_en text;
alter table party_profiles add column if not exists icebreaker_ru text;
alter table party_profiles add column if not exists icebreaker_en text;

update parties
set title_ru = coalesce(title_ru, title),
    description_ru = coalesce(description_ru, description),
    rules_text_ru = coalesce(rules_text_ru, rules_text),
    dress_code_text_ru = coalesce(dress_code_text_ru, dress_code_text)
where true;

update party_profiles
set bio_ru = coalesce(bio_ru, bio),
    icebreaker_ru = coalesce(icebreaker_ru, icebreaker)
where true;

insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('party-photos', 'party-photos', false)
on conflict (id) do nothing;

create index if not exists idx_party_profiles_party_id
on party_profiles(party_id);

create index if not exists idx_party_profiles_user_party
on party_profiles(user_id, party_id);

create index if not exists idx_profile_likes_from_to
on profile_likes(from_profile_id, to_profile_id);

create index if not exists idx_profile_matches_profiles
on profile_matches(profile_a_id, profile_b_id);

create index if not exists idx_party_access_party_user
on party_access(party_id, user_id);


-- Pending admin grants: owners can add admins before first login.
alter table admin_users add column if not exists pending_email text;
alter table admin_users add column if not exists pending_telegram_username text;

create unique index if not exists idx_admin_users_pending_email_active
on admin_users (lower(pending_email))
where app_user_id is null and is_active = true and pending_email is not null;

create unique index if not exists idx_admin_users_pending_tg_active
on admin_users (lower(pending_telegram_username))
where app_user_id is null and is_active = true and pending_telegram_username is not null;

create index if not exists idx_admin_users_app_user_active
on admin_users(app_user_id, is_active);

-- Telegram bot notifications.
alter table app_users add column if not exists telegram_chat_id bigint;
alter table app_users add column if not exists telegram_notifications_enabled boolean default false;
alter table app_users add column if not exists telegram_notifications_started_at timestamptz;
alter table app_users add column if not exists telegram_notifications_blocked_at timestamptz;
alter table app_users add column if not exists notification_language text default 'ru';

create table if not exists telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  party_id uuid references parties(id) on delete cascade,
  type text not null,
  status text not null default 'queued',
  payload jsonb default '{}'::jsonb,
  error text,
  dedupe_key text unique,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table telegram_link_tokens enable row level security;
alter table notification_logs enable row level security;

create index if not exists idx_telegram_link_tokens_user_created
on telegram_link_tokens(user_id, created_at desc);

create index if not exists idx_telegram_link_tokens_expires
on telegram_link_tokens(expires_at);

create index if not exists idx_notification_logs_user_created
on notification_logs(user_id, created_at desc);

create index if not exists idx_notification_logs_party_type
on notification_logs(party_id, type);

create index if not exists idx_app_users_telegram_chat_enabled
on app_users(telegram_chat_id, telegram_notifications_enabled);
