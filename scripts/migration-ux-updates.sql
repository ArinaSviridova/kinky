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
