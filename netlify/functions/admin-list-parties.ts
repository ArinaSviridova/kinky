import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { publicParty } from './_shared/party';

const partyColumns = [
  'id',
  'slug',
  'title',
  'title_ru',
  'title_en',
  'starts_at',
  'access_closes_at',
  'is_active',
].join(',');

export async function handler(event: any) {
  try {
    await requireAdmin(event);
    const supabase = supabaseAdmin();
    const { data, error: listError } = await supabase
      .from('parties')
      .select(partyColumns)
      .eq('is_active', true)
      .order('starts_at', { ascending: false });
    if (listError) return error(listError.message, 500);
    return json({ parties: (data || []).map(publicParty) });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа к админке' : 'Нужно войти', e.message === 'FORBIDDEN' ? 403 : 401);
  }
}
