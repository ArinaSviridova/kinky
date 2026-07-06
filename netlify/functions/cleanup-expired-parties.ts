import { schedule } from '@netlify/functions';
import { supabaseAdmin } from './_shared/supabase';
import { cleanupPartyData } from './_shared/party';

const scheduled = schedule('@hourly', async () => {
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: expiredParties, error } = await supabase
    .from('parties')
    .select('id')
    .eq('is_active', true)
    .lt('access_closes_at', now);

  if (error) return { statusCode: 500, body: error.message };

  for (const party of expiredParties || []) {
    await cleanupPartyData(party.id);
  }

  return { statusCode: 200, body: 'Cleanup done' };
});

export { scheduled as handler };
