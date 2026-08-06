import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { publicParty, signPhotoPaths } from './_shared/party';

const profileColumns = [
  'id',
  'party_id',
  'user_id',
  'nickname',
  'telegram_username',
  'photo_urls',
  'is_visible',
  'is_blocked',
  'created_at',
].join(',');

export async function handler(event: any) {
  try {
    await requireAdmin(event, ['owner', 'admin', 'moderator']);
    const partyId = event.queryStringParameters?.partyId;
    if (!partyId) return error('partyId required', 400);
    const supabase = supabaseAdmin();

    const partyPromise = supabase.from('parties').select('*').eq('id', partyId).maybeSingle();
    const profilesPromise = supabase
      .from('party_profiles')
      .select(profileColumns)
      .eq('party_id', partyId)
      .order('created_at', { ascending: false });

    const [{ data: party }, { data, error: listError }] = await Promise.all([partyPromise, profilesPromise]);
    if (listError) return error(listError.message, 500);

    const rows = data || [];
    const firstPhotoPaths = rows
      .map((profile) => Array.isArray(profile.photo_urls) ? profile.photo_urls[0] : null)
      .filter(Boolean) as string[];
    const signedUrls = await signPhotoPaths(firstPhotoPaths);
    const signedByPath = new Map(firstPhotoPaths.map((path, index) => [path, signedUrls[index]]));

    const profiles = rows.map((profile) => {
      const firstPath = Array.isArray(profile.photo_urls) ? profile.photo_urls[0] : null;
      return {
        ...profile,
        photo_urls_signed: firstPath && signedByPath.get(firstPath) ? [signedByPath.get(firstPath)] : [],
      };
    });

    return json({ profiles, party: party ? publicParty(party) : null });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
