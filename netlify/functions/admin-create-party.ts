import { requireAdmin } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { hashAccessKey, generateAccessKey, publicParty } from './_shared/party';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);
  try {
    await requireAdmin(event, ['owner', 'admin']);
    const body = parseBody(event);
    const key = generateAccessKey();
    const supabase = supabaseAdmin();

    const { data: party, error: createError } = await supabase.from('parties').insert({
      ...body,
      access_key_hash: hashAccessKey(key),
    }).select('*').single();

    if (createError) return error(createError.message, 500);
    return json({ party: publicParty(party), key });
  } catch (e: any) {
    return error(e.message === 'FORBIDDEN' ? 'Нет доступа' : e.message, e.message === 'FORBIDDEN' ? 403 : 400);
  }
}
