import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { generateAccessKey, hashAccessKey } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin']);
    const { partyId } = parseBody(event);
    if (!partyId) return error('partyId required', 400);
    const key = generateAccessKey();
    const supabase = supabaseAdmin();
    const { error: updateError } = await supabase.from('parties').update({ access_key_hash: hashAccessKey(key) }).eq('id', partyId);
    if (updateError) return error(updateError.message, 500);
    return json({ key });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
