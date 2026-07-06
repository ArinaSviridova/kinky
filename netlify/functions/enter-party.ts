import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { hashAccessKey, isPartyOpenForGuests, publicParty } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { key } = parseBody(event);
    if (!key) return error('Введите ключ', 400);

    const supabase = supabaseAdmin();
    const keyHash = hashAccessKey(String(key));

    const { data: party } = await supabase.from('parties').select('*').eq('access_key_hash', keyHash).eq('is_active', true).maybeSingle();
    if (!party) return error('Неверный ключ', 404);
    if (!isPartyOpenForGuests(party)) return error('Доступ к вечеринке сейчас закрыт', 403);

    await supabase.from('party_access').upsert({ party_id: party.id, user_id: user.id }, { onConflict: 'party_id,user_id' });

    return json({ party: publicParty(party) });
  } catch (e: any) {
    return error(e.message === 'UNAUTHORIZED' ? 'Нужно войти' : e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
