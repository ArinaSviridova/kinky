import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin', 'moderator']);
    const { reportId, status } = parseBody(event);
    if (!reportId || !status) return error('reportId and status required', 400);
    const supabase = supabaseAdmin();
    const { error: updateError } = await supabase.from('profile_reports').update({ status }).eq('id', reportId);
    if (updateError) return error(updateError.message, 500);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
