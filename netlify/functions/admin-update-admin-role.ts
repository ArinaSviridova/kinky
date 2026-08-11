import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

const roles = ['owner', 'admin', 'moderator', 'editor'];

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    await requireAdmin(event, ['owner']);
    const { adminId, role } = parseBody(event);
    const cleanRole = String(role || '').trim().toLowerCase();

    if (!adminId) return error('adminId required', 400);
    if (!roles.includes(cleanRole)) return error('Invalid role', 400);

    const supabase = supabaseAdmin();
    const { data: target, error: targetError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .maybeSingle();

    if (targetError) return error(targetError.message, 500);
    if (!target) return error('admin not found', 404);

    const isDemotingRealOwner = target.role === 'owner' && cleanRole !== 'owner' && target.is_active && target.app_user_id;
    if (isDemotingRealOwner) {
      const { count, error: countError } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('is_active', true)
        .not('app_user_id', 'is', null);

      if (countError) return error(countError.message, 500);
      if ((count || 0) <= 1) return error('Нельзя изменить роль последнего owner.', 400);
    }

    const { data, error: updateError } = await supabase
      .from('admin_users')
      .update({ role: cleanRole })
      .eq('id', adminId)
      .select('*')
      .single();

    if (updateError) return error(updateError.message, 500);
    return json({ admin: data });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
