import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

function publicProfile(profile: any, isMine = false, showTelegram = false) {
  const { telegram_username, user_id, ...safe } = profile;
  return showTelegram || isMine ? { ...safe, telegram_username, user_id } : safe;
}

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    const profileId = event.queryStringParameters?.profileId;
    if (!partyId || !profileId) return error('partyId and profileId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: profile } = await supabase
      .from('party_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .single();

    if (!profile) return error('Анкета не найдена', 404);

    const isMine = profile.user_id === user.id;
    const { data: myProfile } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).eq('user_id', user.id).maybeSingle();
    if (!isMine && !myProfile) return error('Сначала создайте свою анкету', 403);

    let liked = false;
    let matched = false;

    if (myProfile?.id && !isMine) {
      const { data: like } = await supabase.from('profile_likes').select('id').eq('from_profile_id', myProfile.id).eq('to_profile_id', profileId).maybeSingle();
      const { data: match } = await supabase
        .from('profile_matches')
        .select('id')
        .eq('party_id', partyId)
        .or(`and(profile_a_id.eq.${myProfile.id},profile_b_id.eq.${profileId}),and(profile_a_id.eq.${profileId},profile_b_id.eq.${myProfile.id})`)
        .maybeSingle();
      liked = Boolean(like);
      matched = Boolean(match);
    }

    const safe = publicProfile(profile, isMine, matched);
    safe.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);
    safe.isMine = isMine;
    safe.isLikedByMe = liked;
    safe.isMatched = matched;

    return json({ profile: safe, liked, matched });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
