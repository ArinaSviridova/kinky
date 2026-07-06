import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';

export async function handler(event: any) {
  try {
    await requireAdmin(event, ['owner', 'admin', 'moderator']);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    const supabase = supabaseAdmin();
    const { data: reports, error: reportsError } = await supabase.from('profile_reports').select('*').eq('party_id', partyId).order('created_at', { ascending: false });
    if (reportsError) return error(reportsError.message, 500);

    const reportedIds = [...new Set((reports || []).map((r) => r.reported_profile_id))];
    let profileMap: Record<string, any> = {};
    if (reportedIds.length) {
      const { data: profiles } = await supabase.from('party_profiles').select('id,nickname,telegram_username').in('id', reportedIds);
      profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    }

    return json({ reports: (reports || []).map((r) => ({ ...r, reported: profileMap[r.reported_profile_id] || null })) });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
