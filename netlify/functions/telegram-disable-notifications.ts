import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { error: updateError } = await supabaseAdmin()
      .from('app_users')
      .update({ telegram_notifications_enabled: false })
      .eq('id', user.id);

    if (updateError) return error(updateError.message, 500);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message === 'UNAUTHORIZED' ? 'Нужно войти' : e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
