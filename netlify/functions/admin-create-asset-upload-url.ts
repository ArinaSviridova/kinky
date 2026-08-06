import crypto from 'node:crypto';
import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    await requireAdmin(event, ['owner', 'admin', 'editor']);
    const { partyId, fileName, type } = parseBody(event);
    if (!partyId || !fileName || !['logo', 'cover'].includes(type)) return error('partyId, fileName and type required', 400);

    const supabase = supabaseAdmin();
    const path = `parties/${partyId}/${type}/${crypto.randomUUID()}-${safeFileName(String(fileName))}`;
    const { data, error: uploadError } = await supabase.storage.from('event-assets').createSignedUploadUrl(path);
    if (uploadError) return error(uploadError.message, 500);

    const { data: publicData } = supabase.storage.from('event-assets').getPublicUrl(path);
    return json({ path, token: data.token, publicUrl: publicData.publicUrl });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
