import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { getAccessibleParty, publicParty, signPhotoPaths } from './_shared/party';

const profileColumns = [
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

    const { data: myProfile } = await supabase
      .from('party_profiles')
      .select('id')
      .eq('party_id', party.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!myProfile) return json({ party: publicParty(party), matches: [] });

    const { data: matches } = await supabase
      .from('profile_matches')
      .select('profile_a_id,profile_b_id')
      .eq('party_id', party.id)
      .or(`profile_a_id.eq.${myProfile.id},profile_b_id.eq.${myProfile.id}`);

    const otherIds = (matches || []).map((m) => m.profile_a_id === myProfile.id ? m.profile_b_id : m.profile_a_id);
    if (!otherIds.length) return json({ party: publicParty(party), matches: [] });

    const { data: profiles } = await supabase
      .from('party_profiles')
      .select(profileColumns)
      .in('id', otherIds)
      .eq('is_visible', true)
      .eq('is_blocked', false);

    const rows = profiles || [];
    const firstPhotoPaths = rows
      .map((profile) => Array.isArray(profile.photo_urls) ? profile.photo_urls[0] : null)
      .filter(Boolean) as string[];
    const signedUrls = await signPhotoPaths(firstPhotoPaths);
    const signedByPath = new Map(firstPhotoPaths.map((path, index) => [path, signedUrls[index]]));

    const signed = rows.map((profile) => {
      const firstPath = Array.isArray(profile.photo_urls) ? profile.photo_urls[0] : null;
      return {
        ...profile,
        photo_urls_signed: firstPath && signedByPath.get(firstPath) ? [signedByPath.get(firstPath)] : [],
        isMatched: true,
      };
    });

    return json({ party: publicParty(party), matches: signed });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
