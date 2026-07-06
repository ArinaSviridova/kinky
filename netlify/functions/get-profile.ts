import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

function publicProfile(profile: any, showTelegram = false) {
  const { telegram_username, user_id, ...safe } = profile;
  return showTelegram ? { ...safe, telegram_username } : safe;
}

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    const profileId = event.queryStringParameters?.profileId;
    if (!partyId || !profileId) return error('partyId and profileId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).eq('user_id', user.id).single();
    if (!myProfile) return error('Сначала создайте свою анкету', 403);

    const { data: profile } = await supabase
      .from('party_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .single();

    if (!profile) return error('Анкета не найдена', 404);

    const { data: like } = await supabase.from('profile_likes').select('id').eq('from_profile_id', myProfile.id).eq('to_profile_id', profileId).maybeSingle();
    const { data: match } = await supabase
      .from('profile_matches')
      .select('id')
      .eq('party_id', partyId)
      .or(`and(profile_a_id.eq.${myProfile.id},profile_b_id.eq.${profileId}),and(profile_a_id.eq.${profileId},profile_b_id.eq.${myProfile.id})`)
      .maybeSingle();

    const safe = publicProfile(profile, Boolean(match));
    safe.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);

    return json({ profile: safe, liked: Boolean(like), matched: Boolean(match) });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
