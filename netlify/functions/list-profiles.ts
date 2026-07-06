import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

function publicProfile(profile: any) {
  const { telegram_username, user_id, ...safe } = profile;
  return safe;
}

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile } = await supabase.from('party_profiles').select('id').eq('party_id', partyId).eq('user_id', user.id).maybeSingle();

    let query = supabase
      .from('party_profiles')
      .select('*')
      .eq('party_id', partyId)
      .eq('is_visible', true)
      .eq('is_blocked', false)
      .order('created_at', { ascending: false });

    if (myProfile?.id) query = query.neq('id', myProfile.id);

    const { data: rows, error: listError } = await query;
    if (listError) return error(listError.message, 500);

    const profiles = [];
    for (const row of rows || []) {
      const safe = publicProfile(row);
      safe.photo_urls_signed = await signPhotoPaths(row.photo_urls || []);
      profiles.push(safe);
    }

    return json({ profiles });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
