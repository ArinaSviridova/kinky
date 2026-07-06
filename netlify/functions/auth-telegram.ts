import crypto from 'node:crypto';
import { supabaseAdmin } from './_shared/supabase';
import { createSessionToken, sessionCookie } from './_shared/auth';
import { error, json, parseBody } from './_shared/http';

function verifyTelegramAuth(data: Record<string, any>, botToken: string) {
  const { hash, ...authData } = data;
  if (!hash) return false;

  const dataCheckString = Object.keys(authData)
    .sort()
    .filter((key) => authData[key] !== undefined && authData[key] !== null && authData[key] !== '')
    .map((key) => `${key}=${authData[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (String(hash).length !== calculatedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(String(hash)));
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  const data = parseBody(event);
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  if (!verifyTelegramAuth(data, botToken)) return error('Invalid Telegram auth', 401);

  const now = Math.floor(Date.now() / 1000);
  const authDate = Number(data.auth_date);
  if (!authDate || now - authDate > 24 * 60 * 60) return error('Telegram auth expired', 401);

  const supabase = supabaseAdmin();
  const telegramId = String(data.id);
  const telegramUsername = data.username || null;

  let { data: user } = await supabase.from('app_users').select('*').eq('telegram_id', telegramId).maybeSingle();

  if (!user) {
    const { data: created, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_provider: 'telegram',
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        display_name: [data.first_name, data.last_name].filter(Boolean).join(' '),
        avatar_url: data.photo_url || null,
      })
      .select('*')
      .single();

    if (createError) return error(createError.message, 500);
    user = created;
  } else {
    await supabase.from('app_users').update({ telegram_username: telegramUsername, last_login_at: new Date().toISOString() }).eq('id', user.id);
  }

  const token = createSessionToken({ userId: user.id, provider: 'telegram', telegramId, createdAt: Date.now() });
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
}
