import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { isPartyOpenForGuests, publicParty } from './_shared/party';

export async function handler(event: any) {
  try {
    const user = await requireUser(event);
    const slug = event.queryStringParameters?.slug;
    if (!slug) return error('No slug', 400);

    const supabase = supabaseAdmin();
    const { data: party } = await supabase.from('parties').select('*').eq('slug', slug).maybeSingle();
    if (!party || !isPartyOpenForGuests(party)) return error('Событие закрыто или не найдено', 404);

    const { data: access } = await supabase.from('party_access').select('id').eq('party_id', party.id).eq('user_id', user.id).maybeSingle();
    if (!access) return error('Нет доступа к этой вечеринке. Введите ключ.', 403);

    return json({ party: publicParty(party) });
  } catch {
    return error('Нужно войти', 401);
  }
}
