import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { getAccessibleParty, publicParty, signPhotoPaths } from './_shared/party';

function publicProfile(profile: any, isMine = false, showTelegram = false) {
  const { telegram_username, user_id, ...safe } = profile;
  return showTelegram || isMine ? { ...safe, telegram_username, user_id } : safe;
}

const listColumns = [
  'id',
  'party_id',
  'user_id',
  'nickname',
  'telegram_username',
  'photo_urls',
  'bio',
  'bio_ru',
  'bio_en',
  'going_as',
  'interested_in',
  'looking_for',
  'is_visible',
  'is_blocked',
  'created_at',
].join(',');

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    const slug = event.queryStringParameters?.slug;
    if (!partyId && !slug) return error('partyId or slug required', 400);

    const party = await getAccessibleParty(user.id, { partyId, slug });
    const supabase = supabaseAdmin();

    const { data: rows, error: listError } = await supabase
      .from('party_profiles')
      .select(listColumns)
      .eq('party_id', party.id)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .order('created_at', { ascending: false });

    if (listError) return error(listError.message, 500);

    const profileRows = rows || [];
    const myProfile = profileRows.find((row) => row.user_id === user.id) || null;
    const myProfileId = myProfile?.id || '';
    const ids = profileRows.map((row) => row.id);

    const likesPromise = myProfileId && ids.length
      ? supabase
        .from('profile_likes')
        .select('to_profile_id')
        .eq('from_profile_id', myProfileId)
        .in('to_profile_id', ids)
      : Promise.resolve({ data: [] as any[] });

    const matchesPromise = myProfileId
      ? supabase
        .from('profile_matches')
        .select('profile_a_id,profile_b_id')
        .eq('party_id', party.id)
        .or(`profile_a_id.eq.${myProfileId},profile_b_id.eq.${myProfileId}`)
      : Promise.resolve({ data: [] as any[] });

    const firstPhotoPaths = profileRows
      .map((row) => Array.isArray(row.photo_urls) ? row.photo_urls[0] : null)
      .filter(Boolean) as string[];

    const [likesResult, matchesResult, signedUrls] = await Promise.all([
      likesPromise,
      matchesPromise,
      signPhotoPaths(firstPhotoPaths),
    ]);

    const likedIds = new Set((likesResult.data || []).map((like: any) => like.to_profile_id));
    const matchedIds = new Set((matchesResult.data || []).map((match: any) => (
      match.profile_a_id === myProfileId ? match.profile_b_id : match.profile_a_id
    )));
    const signedByPath = new Map(firstPhotoPaths.map((path, index) => [path, signedUrls[index]]));

    const profiles = profileRows.map((row) => {
      const isMine = row.user_id === user.id;
      const isMatched = matchedIds.has(row.id);
      const safe = publicProfile(row, isMine, isMatched);
      const firstPath = Array.isArray(row.photo_urls) ? row.photo_urls[0] : null;
      safe.photo_urls_signed = firstPath && signedByPath.get(firstPath) ? [signedByPath.get(firstPath)] : [];
      safe.isMine = isMine;
      safe.isLikedByMe = likedIds.has(row.id);
      safe.isMatched = isMatched;
      return safe;
    });

    profiles.sort((a, b) => Number(b.isMine) - Number(a.isMine) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return json({ party: publicParty(party), profiles });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
