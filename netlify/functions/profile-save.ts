import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

const allowed = [
  'nickname', 'telegram_username',
  'bio', 'bio_ru', 'bio_en',
  'photo_urls', 'going_as', 'interested_in', 'looking_for',
  'looking_for_text_ru', 'looking_for_text_en',
  'approach_preferences', 'approach_text_ru', 'approach_text_en',
  'boundaries', 'boundaries_text_ru', 'boundaries_text_en',
  'languages', 'icebreaker', 'icebreaker_ru', 'icebreaker_en',
  'accepted_rules', 'accepted_privacy', 'confirmed_18_plus',
];

function cleanProfile(profile: any) {
  const cleaned: any = {};
  for (const key of allowed) cleaned[key] = profile[key];
  cleaned.telegram_username = String(cleaned.telegram_username || '').replace('@', '').trim();
  cleaned.photo_urls = Array.isArray(cleaned.photo_urls) ? cleaned.photo_urls.filter(Boolean).slice(0, 5) : [];
  cleaned.bio = cleaned.bio_ru || cleaned.bio_en || cleaned.bio || '';
  cleaned.icebreaker = cleaned.icebreaker_ru || cleaned.icebreaker_en || cleaned.icebreaker || '';
  return cleaned;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { partyId, profile } = parseBody(event);
    if (!partyId || !profile) return error('partyId and profile required', 400);
    await requirePartyAccess(user.id, partyId);

    const cleaned = cleanProfile(profile);
    if (!cleaned.nickname || !cleaned.telegram_username || !cleaned.bio) return error('Заполните ник, Telegram и описание на русском или английском', 400);
    if (!cleaned.photo_urls.length) return error('Нужно минимум одно фото', 400);
    if (cleaned.photo_urls.length > 5) return error('Можно загрузить не больше 5 фото', 400);
    if (!cleaned.confirmed_18_plus || !cleaned.accepted_rules || !cleaned.accepted_privacy) return error('Нужно подтвердить возраст, правила и приватность', 400);

    const supabase = supabaseAdmin();
    const { data: saved, error: saveError } = await supabase
      .from('party_profiles')
      .upsert({ party_id: partyId, user_id: user.id, ...cleaned, updated_at: new Date().toISOString() }, { onConflict: 'party_id,user_id' })
      .select('*')
      .single();

    if (saveError) return error(saveError.message, 500);
    saved.photo_urls_signed = await signPhotoPaths(saved.photo_urls || []);
    saved.isMine = true;
    return json({ profile: saved });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'PARTY_CLOSED' || e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
