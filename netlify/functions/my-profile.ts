import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { getAccessibleParty, publicParty, signPhotoPaths } from './_shared/party';

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const partyId = event.queryStringParameters?.partyId;
    const slug = event.queryStringParameters?.slug;
    if (!partyId && !slug) return error('partyId or slug required', 400);

    const party = await getAccessibleParty(user.id, { partyId, slug });
    const supabase = supabaseAdmin();
    const { data: profile } = await supabase
      .from('party_profiles')
      .select('*')
      .eq('party_id', party.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) profile.photo_urls_signed = await signPhotoPaths(profile.photo_urls || []);
    return json({ party: publicParty(party), profile });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
