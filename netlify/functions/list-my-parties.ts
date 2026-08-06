import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { isPartyOpenForGuests, publicParty } from './_shared/party';

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const supabase = supabaseAdmin();
    const { data: accessRows, error: accessError } = await supabase
      .from('party_access')
      .select('party_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (accessError) return error(accessError.message, 500);
    const partyIds = (accessRows || []).map((row) => row.party_id);
    if (!partyIds.length) return json({ parties: [] });

    const { data: parties, error: partyError } = await supabase
      .from('parties')
      .select('*')
      .in('id', partyIds)
      .eq('is_active', true)
      .order('starts_at', { ascending: true });

    if (partyError) return error(partyError.message, 500);
    return json({ parties: (parties || []).filter(isPartyOpenForGuests).map(publicParty) });
  } catch (e: any) {
    return error(e.message === 'UNAUTHORIZED' ? 'Нужно войти' : e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
