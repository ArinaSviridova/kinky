import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

const roles = ['owner', 'admin', 'moderator', 'editor'];

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    await requireAdmin(event, ['owner']);
    const { identifier, role } = parseBody(event);
    const rawIdentifier = String(identifier || '').trim();
    const isEmail = rawIdentifier.includes('@');
    const cleanIdentifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace('@', '');
    const cleanRole = roles.includes(role) ? role : 'admin';
    if (!cleanIdentifier) return error('identifier required', 400);

    const supabase = supabaseAdmin();
    const query = supabase.from('app_users').select('*');
    const { data: user } = isEmail
      ? await query.eq('google_email', cleanIdentifier).maybeSingle()
      : await query.eq('telegram_username', cleanIdentifier).maybeSingle();

    if (!user) return error('Пользователь не найден. Он должен сначала войти в приложение через Google или Telegram.', 404);

    const { data: admin, error: upsertError } = await supabase
      .from('admin_users')
      .upsert({ app_user_id: user.id, role: cleanRole, is_active: true }, { onConflict: 'app_user_id' })
      .select('*')
      .single();

    if (upsertError) return error(upsertError.message, 500);
    return json({ admin });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
