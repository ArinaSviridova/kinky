import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { publicParty } from './_shared/party';

export async function handler(event: any) {
  try {
    await requireAdmin(event);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    const supabase = supabaseAdmin();
    const { data: party } = await supabase.from('parties').select('*').eq('id', partyId).single();
    if (!party) return error('Not found', 404);
    return json({ party: publicParty(party) });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа к админке' : 'Нужно войти', e.message === 'FORBIDDEN' ? 403 : 401);
  }
}
