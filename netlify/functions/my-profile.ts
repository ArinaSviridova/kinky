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
    const { data: profile } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).eq('user_id', user.id).maybeSingle();
    if (profile) profile.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);
    return json({ profile });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
