import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';

export async function handler(event: any) {
  try {
    await requireAdmin(event, ['owner']);
    const supabase = supabaseAdmin();
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('id,app_user_id,role,is_active,created_at,pending_email,pending_telegram_username')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (adminsError) return error(adminsError.message, 500);
    const userIds = (admins || []).map((admin) => admin.app_user_id).filter(Boolean);
    const { data: users } = userIds.length
      ? await supabase.from('app_users').select('id,display_name,google_email,telegram_username,auth_provider').in('id', userIds)
      : { data: [] as any[] };
    const userMap = Object.fromEntries((users || []).map((user) => [user.id, user]));

    return json({
      admins: (admins || []).map((admin) => ({
        ...admin,
        is_pending: !admin.app_user_id,
        user: admin.app_user_id ? userMap[admin.app_user_id] || null : null,
      })),
    });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
