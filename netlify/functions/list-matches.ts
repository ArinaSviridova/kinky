import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).eq('user_id', user.id).single();
    if (!myProfile) return json({ matches: [] });

    const { data: matches } = await supabase
      .from('profile_matches')
      .select('*')
      .eq('party_id', partyId)
      .or(`profile_a_id.eq.${myProfile.id},profile_b_id.eq.${myProfile.id}`);

    const otherIds = (matches || []).map((m) => m.profile_a_id === myProfile.id ? m.profile_b_id : m.profile_a_id);
    if (!otherIds.length) return json({ matches: [] });

    const { data: profiles } = await supabase.from('party_profiles').select('*').in('id', otherIds).eq('is_blocked', false);
    const signed = [];
    for (const profile of profiles || []) {
      profile.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);
      signed.push(profile);
    }

    return json({ matches: signed });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
