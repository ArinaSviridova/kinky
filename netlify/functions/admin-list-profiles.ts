import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { publicParty, signPhotoPaths } from './_shared/party';

export async function handler(event: any) {
  try {
    await requireAdmin(event, ['owner', 'admin', 'moderator']);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    const supabase = supabaseAdmin();

    const { data: party } = await supabase.from('parties').select('*').eq('id', partyId).single();
    const { data, error: listError } = await supabase.from('party_profiles').select('*').eq('party_id', partyId).order('created_at', { ascending: false });
    if (listError) return error(listError.message, 500);
    const photoPaths = (data || []).flatMap((profile) => Array.isArray(profile.photo_urls) ? profile.photo_urls : []);
    const signedUrls = await signPhotoPaths(photoPaths);
    const signedByPath = new Map(photoPaths.map((path, index) => [path, signedUrls[index]]));

    const profiles = [];
    for (const profile of data || []) {
      profile.photo_urls_signed = (profile.photo_urls || []).map((path: string) => signedByPath.get(path)).filter(Boolean);
      profiles.push(profile);
    }
    return json({ profiles, party: party ? publicParty(party) : null });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
