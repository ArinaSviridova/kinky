import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase';

export function hashAccessKey(key: string) {
  return crypto.createHash('sha256').update(`${key.trim()}:${process.env.ACCESS_KEY_PEPPER}`).digest('hex');
}

export function generateAccessKey() {
  const part = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KINKY-${part()}-${part()}`;
}

export function publicParty(party: any) {
  const { access_key_hash, ...safe } = party;
  return safe;
}

export function isPartyOpenForGuests(party: any) {
  const now = Date.now();
  return party.is_active && now >= new Date(party.access_opens_at).getTime() && now <= new Date(party.access_closes_at).getTime();
}

export async function requirePartyAccess(userId: string, partyId: string) {
  const party = await getAccessibleParty(userId, { partyId });
  return party;
}

export async function getAccessibleParty(userId: string, params: { partyId?: string; slug?: string }) {
  const supabase = supabaseAdmin();
  let query = supabase.from('parties').select('*');
  if (params.partyId) query = query.eq('id', params.partyId);
  else if (params.slug) query = query.eq('slug', params.slug);
  else throw new Error('PARTY_REQUIRED');

  const { data: party } = await query.maybeSingle();
  if (!party || !isPartyOpenForGuests(party)) throw new Error('PARTY_CLOSED');

  const { data: access } = await supabase
    .from('party_access')
    .select('id')
    .eq('party_id', party.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!access) throw new Error('NO_PARTY_ACCESS');
  return party;
}

export async function signPhotoPaths(paths: string[] = []) {
  const supabase = supabaseAdmin();
  const cleanPaths = (paths || []).filter(Boolean);
  if (!cleanPaths.length) return [];
  const { data } = await supabase.storage.from('party-photos').createSignedUrls(cleanPaths, 60 * 60);
  return (data || []).map((item) => item.signedUrl).filter(Boolean);
}

export async function cleanupPartyData(partyId: string) {
  const supabase = supabaseAdmin();

  const { data: profiles } = await supabase
    .from('party_profiles')
    .select('id, photo_urls')
    .eq('party_id', partyId);

  for (const profile of profiles || []) {
    const paths = Array.isArray(profile.photo_urls) ? profile.photo_urls : [];
    if (paths.length) await supabase.storage.from('party-photos').remove(paths);
  }

  await supabase.from('profile_reports').delete().eq('party_id', partyId);
  await supabase.from('profile_matches').delete().eq('party_id', partyId);
  await supabase.from('profile_likes').delete().eq('party_id', partyId);
  await supabase.from('party_profiles').delete().eq('party_id', partyId);
  await supabase.from('party_access').delete().eq('party_id', partyId);
  await supabase.from('parties').update({ is_active: false }).eq('id', partyId);
}
