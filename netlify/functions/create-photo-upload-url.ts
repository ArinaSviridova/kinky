import crypto from 'node:crypto';
import { requireUser } from './_shared/auth';
import { supabaseAdmin } from './_shared/supabase';
import { error, json, parseBody } from './_shared/http';
import { requirePartyAccess } from './_shared/party';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await requireUser(event);
    const { partyId, fileName } = parseBody(event);
    if (!partyId || !fileName) return error('partyId and fileName required', 400);
    await requirePartyAccess(user.id, partyId);

    const supabase = supabaseAdmin();
    const path = `parties/${partyId}/users/${user.id}/${crypto.randomUUID()}-${safeFileName(String(fileName))}`;
    const { data, error: uploadError } = await supabase.storage.from('party-photos').createSignedUploadUrl(path);
    if (uploadError) return error(uploadError.message, 500);

    return json({ path, token: data.token });
  } catch (e: any) {
    const status = e.message === 'UNAUTHORIZED' ? 401 : e.message === 'PARTY_CLOSED' || e.message === 'NO_PARTY_ACCESS' ? 403 : 400;
    return error(e.message, status);
  }
}
