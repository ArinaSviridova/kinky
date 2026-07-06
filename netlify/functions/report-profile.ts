import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { partyId, reportedProfileId, reason, details } = parseBody(event);
    if (!partyId || !reportedProfileId || !reason) return error('partyId, profile and reason required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const { data: myProfile } = await supabase.from('party_profiles').select('id').eq('party_id', partyId).eq('user_id', user.id).single();
    if (!myProfile) return error('Сначала создайте свою анкету', 403);

    await supabase.from('profile_reports').insert({
      party_id: partyId,
      reporter_profile_id: myProfile.id,
      reported_profile_id: reportedProfileId,
      reason,
      details,
    });

    return json({ ok: true });
  } catch (e: any) {
    return error(e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
