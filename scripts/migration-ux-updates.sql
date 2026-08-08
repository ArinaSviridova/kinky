-- Run this once in Supabase SQL Editor before deploying the UX update.

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

create index if not exists idx_party_profiles_party_id on party_profiles(party_id);
create index if not exists idx_party_profiles_user_party on party_profiles(user_id, party_id);
create index if not exists idx_profile_likes_from_to on profile_likes(from_profile_id, to_profile_id);
create index if not exists idx_profile_matches_profiles on profile_matches(profile_a_id, profile_b_id);
create index if not exists idx_party_access_party_user on party_access(party_id, user_id);
create index if not exists idx_party_profiles_party_visible_created
on party_profiles(party_id, is_visible, is_blocked, created_at desc);

create index if not exists idx_profile_matches_party_a_b
on profile_matches(party_id, profile_a_id, profile_b_id);

create index if not exists idx_profile_matches_party_b_a
on profile_matches(party_id, profile_b_id, profile_a_id);

create index if not exists idx_parties_slug_active_access
on parties(slug, is_active, access_opens_at, access_closes_at);


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

create index if not exists idx_telegram_link_tokens_user_created
on telegram_link_tokens(user_id, created_at desc);

create index if not exists idx_telegram_link_tokens_expires
on telegram_link_tokens(expires_at);

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

create index if not exists idx_notification_logs_user_created
on notification_logs(user_id, created_at desc);

create index if not exists idx_notification_logs_party_type
on notification_logs(party_id, type);

create index if not exists idx_app_users_telegram_chat_enabled
on app_users(telegram_chat_id, telegram_notifications_enabled);
