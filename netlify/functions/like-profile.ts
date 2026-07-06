import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess } from './_shared/party';

function orderedPair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { partyId, toProfileId } = parseBody(event);
    if (!partyId || !toProfileId) return error('partyId and toProfileId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).eq('user_id', user.id).single();
    if (!myProfile) return error('Сначала создайте свою анкету', 403);
    if (myProfile.id === toProfileId) return error('Самолайк - это мило, но нет', 400);

    const { data: target } = await supabase
      .from('party_profiles')
      .select('id')
      .eq('id', toProfileId)
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .single();

    if (!target) return error('Анкета не найдена', 404);

    await supabase.from('profile_likes').upsert({ party_id: partyId, from_profile_id: myProfile.id, to_profile_id: toProfileId }, { onConflict: 'from_profile_id,to_profile_id' });

    const { data: reciprocal } = await supabase.from('profile_likes').select('id').eq('from_profile_id', toProfileId).eq('to_profile_id', myProfile.id).maybeSingle();

    let matched = false;
    if (reciprocal) {
      const [profile_a_id, profile_b_id] = orderedPair(myProfile.id, toProfileId);
      await supabase.from('profile_matches').upsert({ party_id: partyId, profile_a_id, profile_b_id }, { onConflict: 'profile_a_id,profile_b_id' });
      matched = true;
    }

    return json({ ok: true, matched });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
