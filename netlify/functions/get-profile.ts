import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { getAccessibleParty, publicParty, signPhotoPaths } from './_shared/party';

function publicProfile(profile: any, isMine = false, showTelegram = false) {
  const { telegram_username, user_id, ...safe } = profile;
  return showTelegram || isMine ? { ...safe, telegram_username, user_id } : safe;
}

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    const slug = event.queryStringParameters?.slug;
    const profileId = event.queryStringParameters?.profileId;
    if ((!partyId && !slug) || !profileId) return error('partyId/slug and profileId required', 400);

    const party = await getAccessibleParty(user.id, { partyId, slug });
    const supabase = supabaseAdmin();

    const profilePromise = supabase
      .from('party_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('party_id', party.id)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .maybeSingle();

    const myProfilePromise = supabase
      .from('party_profiles')
      .select('id,user_id')
      .eq('party_id', party.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const [{ data: profile }, { data: myProfile }] = await Promise.all([profilePromise, myProfilePromise]);
    if (!profile) return error('Анкета не найдена', 404);

    const isMine = profile.user_id === user.id;
    if (!isMine && !myProfile) return error('Сначала создайте свою анкету', 403);

    let liked = false;
    let matched = false;

    if (myProfile?.id && !isMine) {
      const likePromise = supabase
        .from('profile_likes')
        .select('id')
        .eq('from_profile_id', myProfile.id)
        .eq('to_profile_id', profileId)
        .maybeSingle();

      const matchPromise = supabase
        .from('profile_matches')
        .select('id')
        .eq('party_id', party.id)
        .or(`and(profile_a_id.eq.${myProfile.id},profile_b_id.eq.${profileId}),and(profile_a_id.eq.${profileId},profile_b_id.eq.${myProfile.id})`)
        .maybeSingle();

      const [likeResult, matchResult] = await Promise.all([likePromise, matchPromise]);
      liked = Boolean(likeResult.data);
      matched = Boolean(matchResult.data);
    }

    const safe = publicProfile(profile, isMine, matched);
    safe.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);
    safe.isMine = isMine;
    safe.isLikedByMe = liked;
    safe.isMatched = matched;

    return json({ party: publicParty(party), profile: safe, liked, matched });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
