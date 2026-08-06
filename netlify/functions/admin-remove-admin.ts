import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    await requireAdmin(event, ['owner']);
    const { adminId } = parseBody(event);
    if (!adminId) return error('adminId required', 400);

    const supabase = supabaseAdmin();
    const { data: target } = await supabase.from('admin_users').select('*').eq('id', adminId).maybeSingle();
    if (!target) return error('admin not found', 404);

    if (target.role === 'owner' && target.is_active && target.app_user_id) {
      const { count } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('is_active', true)
        .not('app_user_id', 'is', null);
      if ((count || 0) <= 1) return error('Нельзя удалить последнего owner.', 400);
    }

    const { error: deleteError } = await supabase.from('admin_users').delete().eq('id', adminId);
    if (deleteError) return error(deleteError.message, 500);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
