import crypto from 'node:crypto';
import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json } from './_shared/http';
import { hashTelegramLinkToken } from './_shared/telegram';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const botUsername = String(process.env.TELEGRAM_BOT_USERNAME || process.env.VITE_TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
    if (!botUsername) return error('TELEGRAM_BOT_USERNAME is missing', 500);

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const supabase = supabaseAdmin();

    const { error: insertError } = await supabase
      .from('telegram_link_tokens')
      .insert({
        user_id: user.id,
        token_hash: hashTelegramLinkToken(token),
        expires_at: expiresAt,
      });

    if (insertError) return error(insertError.message, 500);

    return json({
      url: `https://t.me/${botUsername}?start=notify_${token}`,
      expires_at: expiresAt,
    });
  } catch (e: any) {
    return error(e.message === 'UNAUTHORIZED' ? 'Нужно войти' : e.message, e.message === 'UNAUTHORIZED' ? 401 : 400);
  }
}
