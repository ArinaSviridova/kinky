import { supabaseAdmin } from './_shared/supabase';
import { json } from './_shared/http';
import { hashTelegramLinkToken, sendTelegramMessage } from './_shared/telegram';

function isSecretValid(event: any) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true;
  return event.headers?.['x-telegram-bot-api-secret-token'] === expected
    || event.headers?.['X-Telegram-Bot-Api-Secret-Token'] === expected;
}

async function reply(chatId: number | string, text: string) {
  try {
    await sendTelegramMessage({ chatId, text });
  } catch (e) {
    console.error('Telegram reply failed', e);
  }
}

async function enableByToken(chatId: number | string, rawToken: string) {
  const supabase = supabaseAdmin();
  const tokenHash = hashTelegramLinkToken(rawToken);

  const { data: linkToken, error } = await supabase
    .from('telegram_link_tokens')
    .select('id,user_id,expires_at,used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !linkToken || linkToken.used_at) return false;
  if (new Date(linkToken.expires_at).getTime() < Date.now()) return false;

  await supabase
    .from('app_users')
    .update({
      telegram_chat_id: chatId,
      telegram_notifications_enabled: true,
      telegram_notifications_started_at: new Date().toISOString(),
      telegram_notifications_blocked_at: null,
    })
    .eq('id', linkToken.user_id);

  await supabase
    .from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', linkToken.id);

  return true;
}

async function enableByTelegramId(chatId: number | string, telegramId: string) {
  const supabase = supabaseAdmin();
  const { data: user } = await supabase
    .from('app_users')
    .select('id')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (!user?.id) return false;

  await supabase
    .from('app_users')
    .update({
      telegram_chat_id: chatId,
      telegram_notifications_enabled: true,
      telegram_notifications_started_at: new Date().toISOString(),
      telegram_notifications_blocked_at: null,
    })
    .eq('id', user.id);

  return true;
}

export async function handler(event: any) {
  try {
    if (!isSecretValid(event)) return json({ ok: false }, 401);

    const update = JSON.parse(event.body || '{}');
    const message = update.message;
    const chatId = message?.chat?.id;
    const text = String(message?.text || '').trim();
    const fromTelegramId = message?.from?.id ? String(message.from.id) : '';

    if (!chatId) return json({ ok: true });

    if (text.startsWith('/start')) {
      const payload = text.split(' ')[1] || '';

      if (payload.startsWith('notify_')) {
        const ok = await enableByToken(chatId, payload.replace('notify_', ''));
        await reply(
          chatId,
          ok
            ? 'Уведомления Pre-Party Match включены. Теперь можно вернуться в приложение.'
            : 'Ссылка для подключения уведомлений устарела или уже использована. Вернитесь в приложение и нажмите «Включить уведомления» ещё раз.',
        );
        return json({ ok: true });
      }

      if (fromTelegramId) {
        const ok = await enableByTelegramId(chatId, fromTelegramId);
        if (ok) {
          await reply(chatId, 'Уведомления Pre-Party Match включены. Теперь можно вернуться в приложение.');
          return json({ ok: true });
        }
      }

      await reply(chatId, 'Это бот Pre-Party Match. Чтобы включить уведомления, сначала войдите в приложение, затем нажмите «Включить уведомления» в интерфейсе.');
      return json({ ok: true });
    }

    await reply(chatId, 'Я отправляю только служебные уведомления Pre-Party Match. Для настройки уведомлений откройте приложение.');
    return json({ ok: true });
  } catch (e) {
    console.error('telegram-webhook error', e);
    return json({ ok: true });
  }
}
