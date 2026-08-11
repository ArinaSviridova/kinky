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
    if (!party || !party.is_active) return error('Событие закрыто или не найдено', 404);

    const { data: access } = await supabase.from('party_access').select('id').eq('party_id', party.id).eq('user_id', user.id).maybeSingle();

    if (!access) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('app_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!admin) return error('Нет доступа к этой вечеринке. Введите ключ.', 403);

      await supabase
        .from('party_access')
        .upsert({ party_id: party.id, user_id: user.id }, { onConflict: 'party_id,user_id' });
    } else if (!isPartyOpenForGuests(party)) {
      return error('Доступ к вечеринке закрыт.', 404);
    }

    return json({ party: publicParty(party) });
  } catch {
    return error('Нужно войти', 401);
  }
}
