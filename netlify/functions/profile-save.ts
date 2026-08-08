import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess, signPhotoPaths } from './_shared/party';

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE_BYTES = 500 * 1024;

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
  cleaned.photo_urls = Array.isArray(cleaned.photo_urls) ? cleaned.photo_urls.filter(Boolean) : [];
  cleaned.bio = cleaned.bio_ru || cleaned.bio_en || cleaned.bio || '';
  cleaned.icebreaker = cleaned.icebreaker_ru || cleaned.icebreaker_en || cleaned.icebreaker || '';
  return cleaned;
}

function splitStoragePath(path: string) {
  const parts = path.split('/').filter(Boolean);
  const fileName = parts.pop() || '';
  return { folder: parts.join('/'), fileName };
}

async function validateProfilePhotos(supabase: any, partyId: string, userId: string, photoUrls: string[]) {
  const expectedPrefix = `parties/${partyId}/users/${userId}/`;

  for (const photoPath of photoUrls) {
    if (!String(photoPath).startsWith(expectedPrefix)) {
      throw new Error('Некорректный путь фотографии');
    }

    const { folder, fileName } = splitStoragePath(String(photoPath));
    const { data, error: listError } = await supabase.storage
      .from('party-photos')
      .list(folder, { limit: 100, search: fileName });

    if (listError) throw new Error(listError.message);

    const item = (data || []).find((entry: any) => entry.name === fileName);
    const size = Number(item?.metadata?.size || item?.metadata?.contentLength || 0);

    if (!item) throw new Error('Фотография не найдена в Storage');
    if (!size || size > MAX_PHOTO_SIZE_BYTES) {
      throw new Error('Одно фото после сжатия должно быть не больше 500 KB. Попробуйте другое фото.');
    }
  }
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
    if (cleaned.photo_urls.length > MAX_PHOTOS) return error('Можно загрузить не больше 5 фото', 400);
    if (!cleaned.confirmed_18_plus || !cleaned.accepted_rules || !cleaned.accepted_privacy) return error('Нужно подтвердить возраст, правила и приватность', 400);

    const supabase = supabaseAdmin();
    await validateProfilePhotos(supabase, partyId, user.id, cleaned.photo_urls);

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
