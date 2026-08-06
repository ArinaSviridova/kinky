import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { publicParty } from './_shared/party';

const allowed = [
  'title', 'title_ru', 'title_en', 'slug',
  'description', 'description_ru', 'description_en',
  'location_ru', 'location_en',
  'starts_at', 'ends_at', 'access_opens_at', 'access_closes_at',
  'logo_url', 'cover_url', 'theme',
  'rules_text', 'rules_text_ru', 'rules_text_en',
  'dress_code_text', 'dress_code_text_ru', 'dress_code_text_en',
  'pinterest_links', 'is_active',
];

function cleanParty(party: any) {
  const cleaned: any = {};
  for (const key of allowed) if (party[key] !== undefined) cleaned[key] = party[key];
  cleaned.title = cleaned.title_ru || cleaned.title || cleaned.title_en;
  cleaned.description = cleaned.description_ru || cleaned.description || cleaned.description_en || null;
  cleaned.rules_text = cleaned.rules_text_ru || cleaned.rules_text || cleaned.rules_text_en || null;
  cleaned.dress_code_text = cleaned.dress_code_text_ru || cleaned.dress_code_text || cleaned.dress_code_text_en || null;
  cleaned.logo_url = cleaned.logo_url || '/kinky-logo.png';
  cleaned.pinterest_links = Array.isArray(cleaned.pinterest_links) ? cleaned.pinterest_links : [];
  cleaned.updated_at = new Date().toISOString();
  return cleaned;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin', 'editor']);
    const { partyId, party } = parseBody(event);
    if (!partyId || !party) return error('partyId and party required', 400);
    const supabase = supabaseAdmin();
    const { data, error: updateError } = await supabase.from('parties').update(cleanParty(party)).eq('id', partyId).select('*').single();
    if (updateError) return error(updateError.message, 500);
    return json({ party: publicParty(data) });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
