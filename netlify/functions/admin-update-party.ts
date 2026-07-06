import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { publicParty } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin', 'editor']);
    const { partyId, party } = parseBody(event);
    if (!partyId || !party) return error('partyId and party required', 400);
    delete party.access_key_hash;
    delete party.id;
    const supabase = supabaseAdmin();
    const { data, error: updateError } = await supabase.from('parties').update(party).eq('id', partyId).select('*').single();
    if (updateError) return error(updateError.message, 500);
    return json({ party: publicParty(data) });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
