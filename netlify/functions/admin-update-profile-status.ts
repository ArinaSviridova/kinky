import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin', 'moderator']);
    const { profileId, is_visible, is_blocked } = parseBody(event);
    if (!profileId) return error('profileId required', 400);
    const patch: any = {};
    if (typeof is_visible === 'boolean') patch.is_visible = is_visible;
    if (typeof is_blocked === 'boolean') patch.is_blocked = is_blocked;
    const supabase = supabaseAdmin();
    const { error: updateError } = await supabase.from('party_profiles').update(patch).eq('id', profileId);
    if (updateError) return error(updateError.message, 500);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
