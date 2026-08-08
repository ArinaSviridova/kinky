import { supabaseAdmin } from './_shared/supabase';
import { json } from './_shared/http';
import { notifyPartyAccessGranted } from './_shared/telegram';

export const config = {
  schedule: '@hourly',
};

export async function handler() {
  const supabase = supabaseAdmin();
  const now = new Date();
  const from = new Date(now.getTime() - 70 * 60 * 1000).toISOString();
  const to = now.toISOString();

  const { data: parties, error: partyError } = await supabase
    .from('parties')
    .select('id')
    .eq('is_active', true)
    .gte('access_opens_at', from)
    .lte('access_opens_at', to);

  if (partyError) return json({ ok: false, error: partyError.message }, 500);

  for (const party of parties || []) {
    const { data: accessRows } = await supabase
      .from('party_access')
      .select('user_id')
      .eq('party_id', party.id);

    for (const row of accessRows || []) {
      await notifyPartyAccessGranted({ partyId: party.id, userId: row.user_id });
    }
  }

  return json({ ok: true, parties: parties?.length || 0 });
}
