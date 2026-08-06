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
    if (!partyId) return error('partyId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: rows, error: listError } = await supabase
      .from('party_profiles')
      .select('*')
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .order('created_at', { ascending: false });

    if (listError) return error(listError.message, 500);

    const myProfile = (rows || []).find((row) => row.user_id === user.id) || null;
    const myProfileId = myProfile?.id || '';
    const ids = (rows || []).map((row) => row.id);

    let likedIds = new Set<string>();
    let matchedIds = new Set<string>();

    if (myProfileId && ids.length) {
      const { data: likes } = await supabase
        .from('profile_likes')
        .select('to_profile_id')
        .eq('from_profile_id', myProfileId)
        .in('to_profile_id', ids);
      likedIds = new Set((likes || []).map((like) => like.to_profile_id));

      const { data: matches } = await supabase
        .from('profile_matches')
        .select('profile_a_id,profile_b_id')
        .eq('party_id', partyId)
        .or(`profile_a_id.eq.${myProfileId},profile_b_id.eq.${myProfileId}`);
      matchedIds = new Set((matches || []).map((match) => match.profile_a_id === myProfileId ? match.profile_b_id : match.profile_a_id));
    }

    const photoPaths = (rows || []).flatMap((row) => Array.isArray(row.photo_urls) ? row.photo_urls : []);
    const signedUrls = await signPhotoPaths(photoPaths);
    const signedByPath = new Map(photoPaths.map((path, index) => [path, signedUrls[index]]));

    const profiles = [];
    for (const row of rows || []) {
      const isMine = row.user_id === user.id;
      const isMatched = matchedIds.has(row.id);
      const safe = publicProfile(row, isMine, isMatched);
      safe.photo_urls_signed = (row.photo_urls || []).map((path: string) => signedByPath.get(path)).filter(Boolean);
      safe.isMine = isMine;
      safe.isLikedByMe = likedIds.has(row.id);
      safe.isMatched = isMatched;
      profiles.push(safe);
    }

    profiles.sort((a, b) => Number(b.isMine) - Number(a.isMine) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return json({ profiles });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
