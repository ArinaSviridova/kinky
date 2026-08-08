import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase';

export type NotificationText = {
  ru: string;
  en: string;
};

function appUrl(path = '/') {
  const base = (process.env.SITE_URL || 'https://kinky-preparty.netlify.app').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function escapeHtml(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function hashTelegramLinkToken(token: string) {
  return crypto
    .createHash('sha256')
    .update(`${token}:${process.env.ACCESS_KEY_PEPPER || ''}`)
    .digest('hex');
}

async function reserveNotification(params: {
  userId?: string | null;
  partyId?: string | null;
  type: string;
  dedupeKey: string;
  payload?: Record<string, unknown>;
}) {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('notification_logs')
      .insert({
        user_id: params.userId || null,
        party_id: params.partyId || null,
        type: params.type,
        status: 'queued',
        dedupe_key: params.dedupeKey,
        payload: params.payload || {},
      })
      .select('id')
      .single();

    if (error || !data?.id) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

async function markNotification(id: string | null, status: 'sent' | 'skipped' | 'failed', errorMessage?: string) {
  if (!id) return;
  try {
    await supabaseAdmin()
      .from('notification_logs')
      .update({
        status,
        error: errorMessage || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', id);
  } catch {
    // Notification logging must never break the main app flow.
  }
}

export async function sendTelegramMessage(params: {
  chatId: number | string;
  text: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing');

  const body: any = {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  if (params.buttonText && params.buttonUrl) {
    body.reply_markup = {
      inline_keyboard: [[{ text: params.buttonText, url: params.buttonUrl }]],
    };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.ok) throw new Error(payload?.description || 'Telegram sendMessage failed');
  return payload.result;
}

async function getNotifiableUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin()
      .from('app_users')
      .select('id,telegram_chat_id,telegram_notifications_enabled,notification_language')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data?.telegram_chat_id || !data.telegram_notifications_enabled) return null;
    return data;
  } catch {
    return null;
  }
}

export async function notifyUser(params: {
  userId: string;
  partyId?: string | null;
  type: string;
  dedupeKey: string;
  text: NotificationText;
  buttonText?: NotificationText;
  buttonPath?: string;
  payload?: Record<string, unknown>;
}) {
  const logId = await reserveNotification(params);
  if (!logId) return;

  const user = await getNotifiableUser(params.userId);
  if (!user) {
    await markNotification(logId, 'skipped', 'Telegram notifications disabled or chat_id missing');
    return;
  }

  const isEnglish = user.notification_language === 'en';
  const text = isEnglish ? params.text.en : params.text.ru;
  const buttonText = params.buttonText ? (isEnglish ? params.buttonText.en : params.buttonText.ru) : undefined;

  try {
    await sendTelegramMessage({
      chatId: user.telegram_chat_id,
      text,
      buttonText,
      buttonUrl: params.buttonPath ? appUrl(params.buttonPath) : undefined,
    });
    await markNotification(logId, 'sent');
  } catch (e: any) {
    await markNotification(logId, 'failed', e.message);
    if (String(e.message || '').includes('bot was blocked')) {
      try {
        await supabaseAdmin()
          .from('app_users')
          .update({ telegram_notifications_enabled: false, telegram_notifications_blocked_at: new Date().toISOString() })
          .eq('id', params.userId);
      } catch {
        // Ignore.
      }
    }
  }
}

async function getParty(partyId: string) {
  const { data } = await supabaseAdmin()
    .from('parties')
    .select('id,slug,title,title_ru,title_en')
    .eq('id', partyId)
    .maybeSingle();
  return data || null;
}

function partyTitle(party: any, locale: 'ru' | 'en') {
  if (!party) return 'Pre-party Match';
  return locale === 'en'
    ? (party.title_en || party.title || party.title_ru || 'Party')
    : (party.title_ru || party.title || party.title_en || 'Вечеринка');
}

async function adminUserIds(roles = ['owner', 'admin', 'moderator']) {
  const { data } = await supabaseAdmin()
    .from('admin_users')
    .select('app_user_id,role')
    .eq('is_active', true)
    .not('app_user_id', 'is', null)
    .in('role', roles);
  return [...new Set((data || []).map((row: any) => row.app_user_id).filter(Boolean))];
}

export async function notifyMatch(params: { partyId: string; partySlug?: string; profileAUserId: string; profileBUserId: string; matchId: string }) {
  const party = await getParty(params.partyId);
  const slug = params.partySlug || party?.slug || '';
  const buttonPath = slug ? `/party/${slug}/matches` : '/enter-key';

  await Promise.all([params.profileAUserId, params.profileBUserId].map((userId) => notifyUser({
    userId,
    partyId: params.partyId,
    type: 'match_created',
    dedupeKey: `match_created:${params.matchId}:${userId}`,
    text: {
      ru: `У вас новый match в Pre-Party Match.\n\nВечеринка: <b>${escapeHtml(partyTitle(party, 'ru'))}</b>`,
      en: `You have a new match in Pre-Party Match.\n\nParty: <b>${escapeHtml(partyTitle(party, 'en'))}</b>`,
    },
    buttonText: { ru: 'Открыть match', en: 'Open match' },
    buttonPath,
  })));
}

export async function notifyReportCreated(params: { partyId: string; reportId: string }) {
  const party = await getParty(params.partyId);
  const slug = party?.slug || '';
  const ids = await adminUserIds(['owner', 'admin', 'moderator']);

  await Promise.all(ids.map((userId) => notifyUser({
    userId,
    partyId: params.partyId,
    type: 'report_created',
    dedupeKey: `report_created:${params.reportId}:${userId}`,
    text: {
      ru: `Новая жалоба в Pre-Party Match.\n\nВечеринка: <b>${escapeHtml(partyTitle(party, 'ru'))}</b>`,
      en: `New report in Pre-Party Match.\n\nParty: <b>${escapeHtml(partyTitle(party, 'en'))}</b>`,
    },
    buttonText: { ru: 'Открыть жалобы', en: 'Open reports' },
    buttonPath: slug ? `/admin/parties/${params.partyId}/reports` : '/admin',
  })));
}

export async function notifyPartyCodeCreated(params: { partyId: string; code: string }) {
  const party = await getParty(params.partyId);
  const ids = await adminUserIds(['owner', 'admin']);

  await Promise.all(ids.map((userId) => notifyUser({
    userId,
    partyId: params.partyId,
    type: 'party_code_created',
    dedupeKey: `party_code_created:${params.partyId}:${params.code}:${userId}`,
    text: {
      ru: `Создан код доступа для вечеринки.\n\nВечеринка: <b>${escapeHtml(partyTitle(party, 'ru'))}</b>\nКод: <code>${escapeHtml(params.code)}</code>`,
      en: `Access code created for the party.\n\nParty: <b>${escapeHtml(partyTitle(party, 'en'))}</b>\nCode: <code>${escapeHtml(params.code)}</code>`,
    },
    buttonText: { ru: 'Открыть админку', en: 'Open admin' },
    buttonPath: `/admin/parties/${params.partyId}`,
  })));
}

export async function notifyPartyAccessGranted(params: { partyId: string; userId: string }) {
  const party = await getParty(params.partyId);
  const slug = party?.slug || '';

  await notifyUser({
    userId: params.userId,
    partyId: params.partyId,
    type: 'party_access_granted',
    dedupeKey: `party_access_granted:${params.partyId}:${params.userId}`,
    text: {
      ru: `Доступ к pre-party открыт.\n\nВечеринка: <b>${escapeHtml(partyTitle(party, 'ru'))}</b>`,
      en: `Pre-party access is open.\n\nParty: <b>${escapeHtml(partyTitle(party, 'en'))}</b>`,
    },
    buttonText: { ru: 'Открыть вечеринку', en: 'Open party' },
    buttonPath: slug ? `/party/${slug}` : '/enter-key',
  });
}
