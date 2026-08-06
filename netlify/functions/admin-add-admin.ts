import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { normalizeAdminIdentifier } from './_shared/adminGrants';

const roles = ['owner', 'admin', 'moderator', 'editor'];

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    await requireAdmin(event, ['owner']);
    const { identifier, role } = parseBody(event);
    const { value: cleanIdentifier, isEmail } = normalizeAdminIdentifier(identifier);
    const cleanRole = roles.includes(role) ? role : 'admin';
    if (!cleanIdentifier) return error('identifier required', 400);

    const supabase = supabaseAdmin();
    const { data: user } = isEmail
      ? await supabase.from('app_users').select('*').eq('google_email', cleanIdentifier).maybeSingle()
      : await supabase.from('app_users').select('*').ilike('telegram_username', cleanIdentifier).maybeSingle();

    if (user) {
      const { data: existing } = await supabase
        .from('admin_users')
        .select('*')
        .eq('app_user_id', user.id)
        .maybeSingle();

      const adminPayload = {
        app_user_id: user.id,
        role: cleanRole,
        is_active: true,
        pending_email: isEmail ? cleanIdentifier : null,
        pending_telegram_username: isEmail ? null : cleanIdentifier,
      };

      const result = existing
        ? await supabase.from('admin_users').update(adminPayload).eq('id', existing.id).select('*').single()
        : await supabase.from('admin_users').insert(adminPayload).select('*').single();

      await supabase
        .from('admin_users')
        .delete()
        .is('app_user_id', null)
        .or(isEmail ? `pending_email.eq.${cleanIdentifier}` : `pending_telegram_username.eq.${cleanIdentifier}`);

      if (result.error) return error(result.error.message, 500);
      return json({ admin: result.data, pending: false });
    }

    const pendingColumn = isEmail ? 'pending_email' : 'pending_telegram_username';
    const { data: existingPending } = await supabase
      .from('admin_users')
      .select('*')
      .is('app_user_id', null)
      .eq(pendingColumn, cleanIdentifier)
      .maybeSingle();

    const pendingPayload = {
      app_user_id: null,
      role: cleanRole,
      is_active: true,
      pending_email: isEmail ? cleanIdentifier : null,
      pending_telegram_username: isEmail ? null : cleanIdentifier,
    };

    const result = existingPending
      ? await supabase.from('admin_users').update(pendingPayload).eq('id', existingPending.id).select('*').single()
      : await supabase.from('admin_users').insert(pendingPayload).select('*').single();

    if (result.error) return error(result.error.message, 500);
    return json({ admin: result.data, pending: true });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
